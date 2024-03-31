import { Descriptor, StringDescriptor } from "./descriptors";

abstract class Element {
    abstract name: string;
    abstract comment: string;
    abstract size: number;
    abstract value: any;

    length(): number {
        return this.size;
    }

    toByteArray(): Uint8Array {
        switch (this.size) {
            case 1:
                return new Uint8Array([this.value & 0xff]);
            case 2:
                return new Uint8Array([
                    this.value & 0xff,
                    (this.value >> 8) & 0xff,
                ]);
            case 4:
                return new Uint8Array([
                    this.value & 0xff,
                    (this.value >> 8) & 0xff,
                    (this.value >> 16) & 0xff,
                    (this.value >> 24) & 0xff,
                ]);
            default:
                throw new Error(`Invalid element size: ${this.size}`);
        }
    }

    isValid(): boolean {
        return true;
    }

    toJSON(): any {
        return {
            name: this.name,
            value: this.value
        };
    }
}

class ConstantElement extends Element {
    name = '';
    comment = '';
    size = 0;
    value = 0;

    isValid(): boolean {
        return true;
    }

    constructor(name: string, comment: string, size: number, value: number) {
        super();
        this.name = name;
        this.comment = comment;
        this.size = size;
        this.value = value;
    }
}

class VariableElement extends Element {
    name = '';
    comment = '';
    size = 0;
    value = 0;
    format = 'dec';

    isValid(): boolean {
        return this.value >= 0 && this.value < (1 << this.size*8);
    }

    constructor(name: string, comment: string, size: number, format: string) {
        super();
        this.name = name;
        this.comment = comment;
        this.size = size;
        this.format = format;
    }
}

type EnumValues = { [key: string]: number };

function selectValues(enumValues: EnumValues): any[] {
    return Object.keys(enumValues).map(key => ({
        label: enumValues[key],
        value: key
    }));
}

class EnumElement extends Element {
    name = '';
    comment = '';
    size = 0;
    value = 0;
    enumValues: EnumValues = {};

    isValid(): boolean {
        if (this.value == undefined)
            return false;

        return Object.values(this.enumValues).includes(this.value);
    }

    selectValues(): any {
        return selectValues(this.enumValues);
    }

    constructor(name: string, comment: string, size: number, enumValues: EnumValues) {
        super();
        this.name = name;
        this.comment = comment;
        this.size = size;
        this.enumValues = enumValues;

        if (Object.values(enumValues).length > 0)
            this.value = Object.values(enumValues)[0];
    }
}

class StringLinkElement extends EnumElement {
    updateStrings(descriptors: StringDescriptor[]): void {
        this.enumValues = {};

        for (const [index, descriptor] of descriptors.entries())
            this.enumValues[descriptor.toString()] = index;
    }

    isValid(): boolean {
        return this.value === 0 || super.isValid();
    }

    constructor(name: string, comment: string, size: number) {
        super(name, comment, size, {});
    }
}
class BitmapElement extends Element {
    name = '';
    comment = '';
    size = 0;
    value = 0;
    bitmapValues: { [key: string]: number } = {};

    constructor(name: string, comment: string, size: number, bitmapValues: { [key: string]: number }) {
        super();
        this.name = name;
        this.comment = comment;
        this.size = size;
        this.bitmapValues = bitmapValues;
        this.value = 0;
    }
}

class AutoElement extends Element {
    name = '';
    comment = '';
    size = 0;
    value = 0;

    update(): number { return 0; }

    constructor(name: string, comment: string, size: number, update: () => number) {
        super();
        this.name = name;
        this.comment = comment;
        this.size = size;
        this.update = update;
    }
}

class LinkElement extends Element {
    name = '';
    comment = '';
    size = 0;
    value = 0;
    getValues: () => EnumValues;

    selectValues(): any {
        return selectValues(this.getValues());
    }

    constructor(name: string, comment: string, size: number, getValues: () => EnumValues) {
        super();
        this.name = name;
        this.comment = comment;
        this.size = size;
        this.getValues = getValues;
    }
}

class StringElement extends Element {
    name = '';
    comment = '';
    size = 0;
    value = '';

    length(): number {
        return this.value.length;
    }

    toByteArray(): Uint8Array {
        return new TextEncoder().encode(this.value);
    }

    constructor(name: string, comment: string) {
        super();
        this.name = name;
        this.comment = comment;
    }
}

export {
    Element,
    ConstantElement,
    VariableElement,
    EnumElement,
    BitmapElement,
    AutoElement,
    LinkElement,
    StringLinkElement,
    StringElement,
};

export type {
    EnumValues,
};