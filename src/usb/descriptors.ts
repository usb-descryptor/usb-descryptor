import {
    AutoElement,
    BitmapElement,
    ConstantElement,
    Element,
    EnumElement,
    StringElement,
    StringLinkElement,
    VariableElement,
} from './elements';

import type { EnumValues } from './elements';

abstract class Descriptor {
    abstract readonly name: string;
    abstract readonly elements: Element[];
    possibleChildTypes: string[] = [];
    index: number = 0;
    children: Descriptor[] = [];

    addChild(type: string): void {
        if (this.canHaveChildType(type)) {
            this.children.push(createDescriptorByType(type));
            this.updateAutoElements();
        } else {
            throw new Error(`Invalid child descriptor type: ${type}`);
        }
    }

    canHaveChildType(type: string): boolean {
        return this.possibleChildTypes.includes(type);
    }

    isValid(): boolean {
        for (const element of this.elements) {
            if (!element.isValid())
                return false;
        }

        return true;
    }

    length(): number {
        return this.elements.reduce((total, element) => total + element.length(), 0);
    }

    updateAutoElements(): void {
        for (const element of this.elements) {
            if (element instanceof AutoElement)
                element.value = element.update();
        }

        for (const child of this.children)
            child.updateAutoElements();
    }

    updateStringLinkElements(descriptors: StringDescriptor[]): void {
        for (const element of this.elements) {
            if (element instanceof StringLinkElement)
                element.updateStrings(descriptors);
        }

        for (const child of this.children)
            child.updateStringLinkElements(descriptors);
    }

    toJSON(): any {
        return {
            name: this.name,
            elements: this.elements.map(element => element.toJSON()),
            children: this.children.map(child => child.toJSON()),
        };
    }
}

const deviceClassEnumValues: EnumValues = {
    'Use class information in the interface Descriptors': 0x0,
    'Communication and CDC Control': 0x2,
    'Hub': 0x9,
    'Billboard Device Class': 0x11,
    'Diagnostic Device': 0xdc,
    'Miscellaneos': 0xef,
    'Vendor-specific': 0xff,
};

const interfaceClassEnumValues: EnumValues = {
    'Audio': 0x1,
    'Communication and CDC Control': 0x2,
    'HID': 0x3,
    'Physical': 0x5,
    'Image': 0x6,
    'Printer': 0x7,
    'Mass Storage': 0x8,
    'CDC Data': 0xa,
    'Smart Card': 0xb,
    'Content Security': 0xd,
    'Video': 0xe,
    'Personal HealthCare': 0xf,
    'Audio/Video devices': 0x10,
    'USB Type-C Bridge Class': 0x12,
    'USB Bulk Display Protocol Device Class': 0x13,
    'MCTP over USB Protocol Endpoint Device Class': 0x14,
    'I3C Device Class': 0x3c,
    'Diagnostic Device': 0xdc,
    'Wireless Controller': 0xe0,
    'Miscellaneos': 0xef,
    'Application specific': 0xfe,
    'Vendor-specific': 0xff,
};

class DeviceDescriptor extends Descriptor {
    readonly name = 'Device Descriptor';
    readonly elements: Element[] = [
        new AutoElement('bLength', 'Length of descriptor in bytes', 1, () => {
            return this.length();
        }),
        new ConstantElement('bDescriptorType', 'DEVICE desriptor type', 1, 1),
        new EnumElement('bcdUSB', 'USB specification release number', 2, {
            '1.0': 0x0100,
            '1.1': 0x0110,
            '2.0': 0x0200,
            '3.0': 0x0300,
        }),
        new EnumElement('bDeviceClass', 'Class code', 1, deviceClassEnumValues),
        new VariableElement('bDeviceSubClass', 'Subclass code', 1, 'hex'),
        new VariableElement('bDeviceProtocol', 'Protocol code', 1, 'hex'),
        new EnumElement('bMaxPacketSize0', 'Maximum packet size for endpoint 0', 1, {
            '8 bytes': 8,
            '16 bytes': 16,
            '32 bytes': 32,
            '64 bytes': 64,
        }),
        new VariableElement('idVendor', 'Vendor ID', 2, 'hex'),
        new VariableElement('idProduct', 'Product ID', 2, 'hex'),
        new VariableElement('bcdDevice', 'Device release number', 2, 'hex'),
        new StringLinkElement('iManufacturer', 'Index of manufacturer string descriptor', 1),
        new StringLinkElement('iProduct', 'Index of product string descriptor', 1),
        new StringLinkElement('iSerialNumber', 'Index of serial number string descriptor', 1),
        new AutoElement('bNumConfigurations', 'Number of configurations', 1, () => {
            return this.children.filter(child => child instanceof ConfigurationDescriptor).length;
         }),
    ];

    isValid(): boolean {
        return super.isValid();
    }
}

class DeviceQualifierDescriptor extends Descriptor {
    readonly name = 'Device Qualifier Descriptor';
    readonly elements: Element[] = [
        new AutoElement('bLength', 'Length of descriptor in bytes', 1, () => {
            return this.length();
        }),
        new ConstantElement('bDescriptorType', 'DEVICE QUALIFIER descriptor type', 1, 6),
        new AutoElement('bLength', 'Length of descriptor in bytes', 1, () => {
            return this.length();
        }),
        new EnumElement('bcdUSB', 'USB specification release number', 2, {
            '1.0': 0x0100,
            '1.1': 0x0110,
            '2.0': 0x0200,
            '3.0': 0x0300,
        }),
        new EnumElement('bDeviceClass', 'Class code', 1, deviceClassEnumValues),
        new VariableElement('bDeviceSubClass', 'Subclass code', 1, 'hex'),
        new VariableElement('bDeviceProtocol', 'Protocol code', 1, 'hex'),
        new EnumElement('bMaxPacketSize0', 'Maximum packet size for endpoint 0', 1, {
            '8 bytes': 8,
            '16 bytes': 16,
            '32 bytes': 32,
            '64 bytes': 64,
        }),
        new VariableElement('bNumConfigurations', 'Number of configurations', 1, 'dec'),
        new ConstantElement('bReserved', 'Reserved', 1, 0),
    ];

    isValid(): boolean {
        return super.isValid();
    }
}

class OtherSpeedConfigurationDescriptor extends Descriptor {
    readonly name = 'Other Speed Configuration Descriptor';
    readonly elements: Element[] = [
        new AutoElement('bLength', 'Length of descriptor in bytes', 1, () => {
            return this.length();
        }),
        new ConstantElement('bDescriptorType', 'OTHER SPEED CONFIGURATION descriptor type', 1, 7),
        new AutoElement('wTotalLength', 'Total length of configuration descriptor', 2, () => {
            return this.children.reduce((total, child) => total + child.length(), this.length());
        }),
        new VariableElement('bNumInterfaces', 'Number of interfaces in configuration', 1, 'dec'),
        new VariableElement('bConfigurationValue', 'Value to select configuration', 1, 'dec'),
        new StringLinkElement('iConfiguration', 'Index of configuration string descriptor', 1),
        new BitmapElement('bmAttributes', 'Configuration characteristics', 1, {
            'Bus-powered': 0x80,
            'Self-powered': 0x40,
            'Remote wakeup': 0x20,
        }),
        new VariableElement('bMaxPower', 'Maximum power consumption in 2mA units', 1, 'dec'),
    ];

    readonly possibleChildTypes: string[] = [
        'Interface Descriptor',
        'Interface Association Descriptor',
        'Device Qualifier Descriptor',
    ];

    isValid(): boolean {
        return super.isValid();
    }
}

class ConfigurationDescriptor extends Descriptor {
    readonly name = 'Configuration Descriptor';
    readonly elements: Element[] = [
        new AutoElement('bLength', 'Length of descriptor in bytes', 1, () => {
            return this.length();
        }),
        new ConstantElement('bDescriptorType', 'CONFIGURATION descriptor type', 1, 2),
        new AutoElement('wTotalLength', 'Total length of configuration descriptor', 2, () => {
            return this.children.reduce((total, child) => total + child.length(), this.length());
        }),
        new VariableElement('bNumInterfaces', 'Number of interfaces in configuration', 1, 'dec'),
        new VariableElement('bConfigurationValue', 'Value to select configuration', 1, 'dec'),
        new StringLinkElement('iConfiguration', 'Index of configuration string descriptor', 1),
        new BitmapElement('bmAttributes', 'Configuration characteristics', 1, {
            'Bus-powered': 0x80,
            'Self-powered': 0x40,
            'Remote wakeup': 0x20,
        }),
        new VariableElement('bMaxPower', 'Maximum power consumption in 2mA units', 1, 'dec'),
    ];

    readonly possibleChildTypes: string[] = [
        'Interface Descriptor',
        'Interface Association Descriptor',
        'Device Qualifier Descriptor',
    ];

    isValid(): boolean {
        return super.isValid();
    }
}

class StringZeroDescriptor extends Descriptor {
    readonly name = 'String Zero Descriptor';
    readonly elements: Element[] = [
        new AutoElement('bLength', 'Length of descriptor in bytes', 1, () => {
            return this.length();
        }),
        new ConstantElement('bDescriptorType', 'STRING descriptor type', 1, 3),
        new EnumElement('wLANGID', 'Language ID', 2, {
            "Afrikaans": 0x0436,
            "Albanian": 0x041c,
            "Arabic (Saudi Arabia)": 0x0401,
            "Arabic (Iraq)": 0x0801,
            "Arabic (Egypt)": 0x0c01,
            "Arabic (Libya)": 0x1001,
            "Arabic (Algeria)": 0x1401,
            "Arabic (Morocco)": 0x1801,
            "Arabic (Tunisia)": 0x1c01,
            "Arabic (Oman)": 0x2001,
            "Arabic (Yemen)": 0x2401,
            "Arabic (Syria)": 0x2801,
            "Arabic (Jordan)": 0x2c01,
            "Arabic (Lebanon)": 0x3001,
            "Arabic (Kuwait)": 0x3401,
            "Arabic (U.A.E.)": 0x3801,
            "Arabic (Bahrain)": 0x3c01,
            "Arabic (Qatar)": 0x4001,
            "Armenian.": 0x042b,
            "Assamese.": 0x044d,
            "Azeri (Latin)": 0x042c,
            "Azeri (Cyrillic)": 0x082c,
            "Basque": 0x042d,
            "Belarussian": 0x0423,
            "Bengali.": 0x0445,
            "Bulgarian": 0x0402,
            "Burmese": 0x0455,
            "Catalan": 0x0403,
            "Chinese (Taiwan)": 0x0404,
            "Chinese (PRC)": 0x0804,
            "Chinese (Hong Kong SAR, PRC)": 0x0c04,
            "Chinese (Singapore)": 0x1004,
            "Chinese (Macau SAR)": 0x1404,
            "Croatian": 0x041a,
            "Czech": 0x0405,
            "Danish": 0x0406,
            "Dutch (Netherlands)": 0x0413,
            "Dutch (Belgium)": 0x0813,
            "English (United States)": 0x0409,
            "English (United Kingdom)": 0x0809,
            "English (Australian)": 0x0c09,
            "English (Canadian)": 0x1009,
            "English (New Zealand)": 0x1409,
            "English (Ireland)": 0x1809,
            "English (South Africa)": 0x1c09,
            "English (Jamaica)": 0x2009,
            "English (Caribbean)": 0x2409,
            "English (Belize)": 0x2809,
            "English (Trinidad)": 0x2c09,
            "English (Zimbabwe)": 0x3009,
            "English (Philippines)": 0x3409,
            "Estonian": 0x0425,
            "Faeroese": 0x0438,
            "Farsi": 0x0429,
            "Finnish": 0x040b,
            "French (Standard)": 0x040c,
            "French (Belgian)": 0x080c,
            "French (Canadian)": 0x0c0c,
            "French (Switzerland)": 0x100c,
            "French (Luxembourg)": 0x140c,
            "French (Monaco)": 0x180c,
            "Georgian.": 0x0437,
            "German (Standard)": 0x0407,
            "German (Switzerland)": 0x0807,
            "German (Austria)": 0x0c07,
            "German (Luxembourg)": 0x1007,
            "German (Liechtenstein)": 0x1407,
            "Greek": 0x0408,
            "Gujarati.": 0x0447,
            "Hebrew": 0x040d,
            "Hindi.": 0x0439,
            "Hungarian": 0x040e,
            "Icelandic": 0x040f,
            "Indonesian": 0x0421,
            "Italian (Standard)": 0x0410,
            "Italian (Switzerland)": 0x0810,
            "Japanese": 0x0411,
            "Kannada.": 0x044b,
            "Kashmiri (India)": 0x0860,
            "Kazakh": 0x043f,
            "Konkani.": 0x0457,
            "Korean": 0x0412,
            "Korean (Johab)": 0x0812,
            "Latvian": 0x0426,
            "Lithuanian": 0x0427,
            "Lithuanian (Classic)": 0x0827,
            "Macedonian": 0x042f,
            "Malay (Malaysian)": 0x043e,
            "Malay (Brunei Darussalam)": 0x083e,
            "Malayalam.": 0x044c,
            "Manipuri": 0x0458,
            "Marathi.": 0x044e,
            "Nepali (India).": 0x0861,
            "Norwegian (Bokmal)": 0x0414,
            "Norwegian (Nynorsk)": 0x0814,
            "Oriya.": 0x0448,
            "Polish": 0x0415,
            "Portuguese (Brazil)": 0x0416,
            "Portuguese (Standard)": 0x0816,
            "Punjabi.": 0x0446,
            "Romanian": 0x0418,
            "Russian": 0x0419,
            "Sanskrit.": 0x044f,
            "Serbian (Cyrillic)": 0x0c1a,
            "Serbian (Latin)": 0x081a,
            "Sindhi": 0x0459,
            "Slovak": 0x041b,
            "Slovenian": 0x0424,
            "Spanish (Traditional Sort)": 0x040a,
            "Spanish (Mexican)": 0x080a,
            "Spanish (Modern Sort)": 0x0c0a,
            "Spanish (Guatemala)": 0x100a,
            "Spanish (Costa Rica)": 0x140a,
            "Spanish (Panama)": 0x180a,
            "Spanish (Dominican Republic)": 0x1c0a,
            "Spanish (Venezuela)": 0x200a,
            "Spanish (Colombia)": 0x240a,
            "Spanish (Peru)": 0x280a,
            "Spanish (Argentina)": 0x2c0a,
            "Spanish (Ecuador)": 0x300a,
            "Spanish (Chile)": 0x340a,
            "Spanish (Uruguay)": 0x380a,
            "Spanish (Paraguay)": 0x3c0a,
            "Spanish (Bolivia)": 0x400a,
            "Spanish (El Salvador)": 0x440a,
            "Spanish (Honduras)": 0x480a,
            "Spanish (Nicaragua)": 0x4c0a,
            "Spanish (Puerto Rico)": 0x500a,
            "Sutu": 0x0430,
            "Swahili (Kenya)": 0x0441,
            "Swedish": 0x041d,
            "Swedish (Finland)": 0x081d,
            "Tamil.": 0x0449,
            "Tatar (Tatarstan)": 0x0444,
            "Telugu.": 0x044a,
            "Thai": 0x041e,
            "Turkish": 0x041f,
            "Ukrainian": 0x0422,
            "Urdu (Pakistan)": 0x0420,
            "Urdu (India)": 0x0820,
            "Uzbek (Latin)": 0x0443,
            "Uzbek (Cyrillic)": 0x0843,
            "Vietnamese": 0x042a,
            "HID (Usage Data Descriptor)": 0x04ff,
            "HID (Vendor Defined 1)": 0xf0ff,
            "HID (Vendor Defined 2)": 0xf4ff,
            "HID (Vendor Defined 3)": 0xf8ff,
            "HID (Vendor Defined 4)": 0xfcff,
        }),
    ];

    isValid(): boolean {
        return super.isValid();
    }
}

class StringDescriptor extends Descriptor {
    readonly name = 'String Descriptor';
    readonly elements: Element[] = [
        new AutoElement('bLength', 'Length of descriptor in bytes', 1, () => {
            return this.length();
        }),
        new ConstantElement('bDescriptorType', 'STRING descriptor type', 1, 3),
        new StringElement('bString', 'String value'),
    ];

    toString(): string {
        return `${this.elements[2].value} (index ${this.index})`;
    }

    isValid(): boolean {
        return super.isValid();
    }
}

class InterfaceDescriptor extends Descriptor {
    readonly name = 'Interface Descriptor';
    readonly elements: Element[] = [
        new ConstantElement('bDescriptorType', 'INTERFACE descriptor type', 1, 4),
        new VariableElement('bInterfaceNumber', 'Number of interface', 1, 'dec'),
        new VariableElement('bAlternateSetting', 'Value to select alternate setting', 1, 'dec'),
        new VariableElement('bNumEndpoints', 'Number of endpoints in interface', 1, 'dec'),
        new VariableElement('bInterfaceClass', 'Class code', 1, 'hex'),
        new EnumElement('bDeviceClass', 'Class code', 1, interfaceClassEnumValues),
        new VariableElement('bDeviceSubClass', 'Subclass code', 1, 'hex'),
        new StringLinkElement('iInterface', 'Index of interface string descriptor', 1),
    ];

    readonly possibleChildTypes: string[] = [
        'Endpoint Descriptor',
        'DFU Functional Descriptor',
        'HID Descriptor',
    ];

    isValid(): boolean {
        return super.isValid();
    }
}

class InterfaceAssociationDescriptor extends Descriptor {
    readonly name = 'Interface Association Descriptor';
    readonly elements: Element[] = [
        new AutoElement('bLength', 'Length of descriptor in bytes', 1, () => {
            return this.length();
        }),
        new ConstantElement('bDescriptorType', 'INTERFACE ASSOCIATION descriptor type', 1, 8),
        new VariableElement('bFirstInterface', 'First interface number', 1, 'dec'),
        new VariableElement('bInterfaceCount', 'Number of interfaces', 1, 'dec'),
        new EnumElement('bFunctionClass', 'Class code', 1, {
            'Defined in interface descriptor': 0,
            'Audio': 1,
            'Communication and CDC Control': 2,
            'HID': 3,
            'Mass Storage': 8,
            'Hub': 9,
            'CDC Data': 10,
            'Vendor-specific': 255,
        }),
        new VariableElement('bFunctionSubClass', 'Subclass code', 1, 'hex'),
        new VariableElement('bFunctionProtocol', 'Protocol code', 1, 'hex'),
        new StringLinkElement('iFunction', 'Index of function string descriptor', 1),
    ];

    isValid(): boolean {
        return super.isValid();
    }
}

class EndpointDescriptor extends Descriptor {
    readonly name = 'Endpoint Descriptor';
    readonly elements: Element[] = [
        new AutoElement('bLength', 'Length of descriptor in bytes', 1, () => {
            return this.length();
        }),
        new ConstantElement('bDescriptorType', 'ENDPOINT descriptor type', 1, 5),
        new VariableElement('bEndpointAddress', 'Endpoint address', 1, 'hex'),
        new EnumElement('bmAttributes', 'Endpoint attributes', 1, {
            'Control': 0x00,
            'Isochronous': 0x01,
            'Bulk': 0x02,
            'Interrupt': 0x03,
        }),
        new VariableElement('wMaxPacketSize', 'Maximum packet size', 2, 'dec'),
        new VariableElement('bInterval', 'Polling interval', 1, 'dec'),
    ];

    isValid(): boolean {
        return super.isValid();
    }
}

class DFUFunctionalDescriptor extends Descriptor {
    readonly name = 'DFU Functional Descriptor';
    readonly elements: Element[] = [
        new AutoElement('bLength', 'Length of descriptor in bytes', 1, () => {
            return this.length();
        }),
        new ConstantElement('bDescriptorType', 'DFU FUNCTIONAL descriptor type', 1, 0x21),
        new BitmapElement('bmAttributes', 'Attributes', 1, {
            'Can download': 0x01,
            'Can upload': 0x02,
            'Manifestation Tolerant': 0x04,
            'Will detach': 0x08,
        }),
        new VariableElement('wDetachTimeOut', 'Detach timeout', 2, 'dec'),
        new VariableElement('wTransferSize', 'Transfer size', 2, 'dec'),
        new VariableElement('bcdDFUVersion', 'DFU version', 2, 'hex'),
    ];

    isValid(): boolean {
        return super.isValid();
    }
}

class HIDDescriptor extends Descriptor {
    readonly name = 'HID Descriptor';
    readonly elements: Element[] = [
        new AutoElement('bLength', 'Length of descriptor in bytes', 1, () => {
            return this.length();
        }),
        new ConstantElement('bDescriptorType', 'HID descriptor type', 1, 0x21),
        new VariableElement('bcdHID', 'HID class specification release number', 2, 'hex'),
        new VariableElement('bCountryCode', 'Country code', 1, 'hex'),
        new VariableElement('bNumDescriptors', 'Number of class descriptors', 1, 'dec'),
    ];

    isValid(): boolean {
        return super.isValid();
    }
}

export {
    Descriptor,
    DeviceDescriptor,
    DeviceQualifierDescriptor,
    ConfigurationDescriptor,
    InterfaceDescriptor,
    InterfaceAssociationDescriptor,
    StringZeroDescriptor,
    StringDescriptor,
    EndpointDescriptor,
    DFUFunctionalDescriptor,
    HIDDescriptor,
};

function createDescriptorByType(type: string): Descriptor {
    switch (type) {
        case 'Device Descriptor':
            return new DeviceDescriptor();
        case 'Device Qualifier Descriptor':
            return new DeviceQualifierDescriptor();
        case 'Other Speed Configuration Descriptor':
            return new OtherSpeedConfigurationDescriptor();
        case 'Configuration Descriptor':
            return new ConfigurationDescriptor();
        case 'Interface Descriptor':
            return new InterfaceDescriptor();
        case 'Interface Association Descriptor':
            return new InterfaceAssociationDescriptor();
        case 'String Zero Descriptor':
            return new StringZeroDescriptor();
        case 'String Descriptor':
            return new StringDescriptor();
        case 'Endpoint Descriptor':
            return new EndpointDescriptor();
        case 'DFU Functional Descriptor':
            return new DFUFunctionalDescriptor();
        case 'HID Descriptor':
            return new HIDDescriptor();
        default:
            throw new Error(`Invalid descriptor type: ${type}`);
    }
}

const rootDescriptorTypes = [
    'Device Descriptor',
    'Configuration Descriptor',
    'Other Speed Configuration Descriptor',
    'String Descriptor',
    'String Zero Descriptor',
];

export {
    createDescriptorByType,
    rootDescriptorTypes,
};
