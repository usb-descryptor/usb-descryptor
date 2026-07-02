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

    addChild(type: string): Descriptor {
        if (!this.canHaveChildType(type)) {
            throw new Error(`Invalid child descriptor type: ${type}`);
        }

        this.children.push(createDescriptorByType(type));
        this.updateAutoElements();

        // Return the instance read back from the array so that, when the tree is
        // held in a reactive store, callers get the reactive proxy (not the raw
        // object) and can select it for editing.
        return this.children[this.children.length - 1];
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- recursive JSON shape not worth modeling; used only by JSON.stringify
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

// Interface subclass codes. Subclass meaning is class-dependent, so entries are
// labeled by their class context; several byte values are shared between classes
// (e.g. 0x06 is CDC ECM and MSC SCSI-transparent). CDC 1.2 Table 4; USB MSC codes.
const interfaceSubClassEnumValues: EnumValues = {
    'None': 0x00,
    // CDC Communications (class 0x02)
    'CDC: Direct Line Control (DLCM)': 0x01,
    'CDC: Abstract Control (ACM)': 0x02,
    'CDC: Telephone Control (TCM)': 0x03,
    'CDC: Multi-Channel Control (MCCM)': 0x04,
    'CDC: CAPI Control (CAPI)': 0x05,
    'CDC: Ethernet Networking (ECM)': 0x06,
    'CDC: ATM Networking (ANCM)': 0x07,
    'CDC: Wireless Handset Control (WHCM)': 0x08,
    'CDC: Device Management (DMM)': 0x09,
    'CDC: Mobile Direct Line (MDLM)': 0x0a,
    'CDC: OBEX': 0x0b,
    'CDC: Ethernet Emulation (EEM)': 0x0c,
    'CDC: Network Control (NCM)': 0x0d,
    // Mass Storage (class 0x08)
    'MSC: RBC': 0x01,
    'MSC: MMC-5 (ATAPI)': 0x02,
    'MSC: UFI': 0x04,
    'MSC: SCSI transparent': 0x06,
    'MSC: LSD FS': 0x07,
    'MSC: IEEE 1667': 0x08,
    // Audio (class 0x01)
    'Audio: AudioControl': 0x01,
    'Audio: AudioStreaming': 0x02,
    'Audio: MIDIStreaming': 0x03,
};

// Interface protocol codes (class-dependent; labeled by class context).
const interfaceProtocolEnumValues: EnumValues = {
    'None / unspecified': 0x00,
    'MSC: CBI (with command completion interrupt)': 0x00,
    'MSC: CBI (no command completion interrupt)': 0x01,
    'MSC: Bulk-Only Transport (BOT)': 0x50,
    'MSC: USB Attached SCSI (UAS)': 0x62,
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
        new AutoElement('bLength', 'Length of descriptor in bytes', 1, () => {
            return this.length();
        }),
        new ConstantElement('bDescriptorType', 'INTERFACE descriptor type', 1, 4),
        new VariableElement('bInterfaceNumber', 'Number of interface', 1, 'dec'),
        new VariableElement('bAlternateSetting', 'Value to select alternate setting', 1, 'dec'),
        new VariableElement('bNumEndpoints', 'Number of endpoints in interface', 1, 'dec'),
        new EnumElement('bInterfaceClass', 'Class code', 1, interfaceClassEnumValues),
        new EnumElement('bInterfaceSubClass', 'Interface subclass code', 1, interfaceSubClassEnumValues),
        new EnumElement('bInterfaceProtocol', 'Interface protocol code', 1, interfaceProtocolEnumValues),
        new StringLinkElement('iInterface', 'Index of interface string descriptor', 1),
    ];

    readonly possibleChildTypes: string[] = [
        'Endpoint Descriptor',
        'DFU Functional Descriptor',
        'HID Descriptor',
        'CDC Header Functional Descriptor',
        'CDC Union Functional Descriptor',
        'CDC Call Management Functional Descriptor',
        'CDC Abstract Control Management Descriptor',
        'CDC Ethernet Networking Functional Descriptor',
        'CDC NCM Functional Descriptor',
        'Audio Control Header',
        'Audio Clock Source',
        'Audio Clock Selector',
        'Audio Clock Multiplier',
        'Audio Input Terminal',
        'Audio Output Terminal',
        'Audio Feature Unit',
        'Audio Selector Unit',
        'Audio Sampling Rate Converter',
        'Audio Streaming General',
        'Audio Streaming Format Type I',
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

    readonly possibleChildTypes: string[] = [
        'Audio Data Endpoint',
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

class CDCHeaderFunctionalDescriptor extends Descriptor {
    readonly name = 'CDC Header Functional Descriptor';
    readonly elements: Element[] = [
        new AutoElement('bFunctionLength', 'Size of descriptor in bytes', 1, () => {
            return this.length();
        }),
        new ConstantElement('bDescriptorType', 'CS_INTERFACE descriptor type', 1, 0x24),
        new ConstantElement('bDescriptorSubtype', 'Header functional descriptor subtype', 1, 0x00),
        new VariableElement('bcdCDC', 'CDC specification release number', 2, 'hex'),
    ];

    isValid(): boolean {
        return super.isValid();
    }
}

class CDCUnionFunctionalDescriptor extends Descriptor {
    readonly name = 'CDC Union Functional Descriptor';
    readonly elements: Element[] = [
        new AutoElement('bFunctionLength', 'Size of descriptor in bytes', 1, () => {
            return this.length();
        }),
        new ConstantElement('bDescriptorType', 'CS_INTERFACE descriptor type', 1, 0x24),
        new ConstantElement('bDescriptorSubtype', 'Union functional descriptor subtype', 1, 0x06),
        new VariableElement('bControlInterface', 'Interface number of the control interface', 1, 'dec'),
        new VariableElement('bSubordinateInterface0', 'Interface number of the first subordinate interface', 1, 'dec'),
    ];

    isValid(): boolean {
        return super.isValid();
    }
}

class CDCCallManagementFunctionalDescriptor extends Descriptor {
    readonly name = 'CDC Call Management Functional Descriptor';
    readonly elements: Element[] = [
        new AutoElement('bFunctionLength', 'Size of descriptor in bytes', 1, () => {
            return this.length();
        }),
        new ConstantElement('bDescriptorType', 'CS_INTERFACE descriptor type', 1, 0x24),
        new ConstantElement('bDescriptorSubtype', 'Call management functional descriptor subtype', 1, 0x01),
        new BitmapElement('bmCapabilities', 'Call management capabilities', 1, {
            'Device handles call management itself': 0x01,
            'Call management over Data class interface': 0x02,
        }),
        new VariableElement('bDataInterface', 'Interface number of the Data class interface', 1, 'dec'),
    ];

    isValid(): boolean {
        return super.isValid();
    }
}

class CDCAbstractControlManagementDescriptor extends Descriptor {
    readonly name = 'CDC Abstract Control Management Descriptor';
    readonly elements: Element[] = [
        new AutoElement('bFunctionLength', 'Size of descriptor in bytes', 1, () => {
            return this.length();
        }),
        new ConstantElement('bDescriptorType', 'CS_INTERFACE descriptor type', 1, 0x24),
        new ConstantElement('bDescriptorSubtype', 'Abstract control management descriptor subtype', 1, 0x02),
        new BitmapElement('bmCapabilities', 'Abstract control management capabilities', 1, {
            'Comm feature Set/Clear/Get requests': 0x01,
            'Line coding, line state, serial state': 0x02,
            'Send Break request': 0x04,
            'Network connection notification': 0x08,
        }),
    ];

    isValid(): boolean {
        return super.isValid();
    }
}

class CDCEthernetNetworkingFunctionalDescriptor extends Descriptor {
    readonly name = 'CDC Ethernet Networking Functional Descriptor';
    readonly elements: Element[] = [
        new AutoElement('bFunctionLength', 'Size of descriptor in bytes', 1, () => {
            return this.length();
        }),
        new ConstantElement('bDescriptorType', 'CS_INTERFACE descriptor type', 1, 0x24),
        new ConstantElement('bDescriptorSubtype', 'Ethernet networking functional descriptor subtype', 1, 0x0f),
        new StringLinkElement('iMACAddress', 'String descriptor holding the 48-bit MAC address', 1),
        // Ethernet statistics the device collects (CDC ECM 1.2 §5.4, Table 4).
        new BitmapElement('bmEthernetStatistics', 'Ethernet statistics capabilities', 4, {
            'XMIT_OK': 0x00000001,
            'RCV_OK': 0x00000002,
            'XMIT_ERROR': 0x00000004,
            'RCV_ERROR': 0x00000008,
            'RCV_NO_BUFFER': 0x00000010,
            'DIRECTED_BYTES_XMIT': 0x00000020,
            'DIRECTED_FRAMES_XMIT': 0x00000040,
            'MULTICAST_BYTES_XMIT': 0x00000080,
            'MULTICAST_FRAMES_XMIT': 0x00000100,
            'BROADCAST_BYTES_XMIT': 0x00000200,
            'BROADCAST_FRAMES_XMIT': 0x00000400,
            'DIRECTED_BYTES_RCV': 0x00000800,
            'DIRECTED_FRAMES_RCV': 0x00001000,
            'MULTICAST_BYTES_RCV': 0x00002000,
            'MULTICAST_FRAMES_RCV': 0x00004000,
            'BROADCAST_BYTES_RCV': 0x00008000,
            'BROADCAST_FRAMES_RCV': 0x00010000,
            'RCV_CRC_ERROR': 0x00020000,
            'TRANSMIT_QUEUE_LENGTH': 0x00040000,
            'RCV_ERROR_ALIGNMENT': 0x00080000,
            'XMIT_ONE_COLLISION': 0x00100000,
            'XMIT_MORE_COLLISIONS': 0x00200000,
            'XMIT_DEFERRED': 0x00400000,
            'XMIT_MAX_COLLISIONS': 0x00800000,
            'RCV_OVERRUN': 0x01000000,
            'XMIT_UNDERRUN': 0x02000000,
            'XMIT_HEARTBEAT_FAILURE': 0x04000000,
            'XMIT_TIMES_CRS_LOST': 0x08000000,
            'XMIT_LATE_COLLISIONS': 0x10000000,
        }),
        new VariableElement('wMaxSegmentSize', 'Maximum Ethernet frame size', 2, 'dec'),
        new VariableElement('wNumberMCFilters', 'Number of multicast filters', 2, 'hex'),
        new VariableElement('bNumberPowerFilters', 'Number of wake-up pattern filters', 1, 'dec'),
    ];

    isValid(): boolean {
        return super.isValid();
    }
}

class CDCNCMFunctionalDescriptor extends Descriptor {
    readonly name = 'CDC NCM Functional Descriptor';
    readonly elements: Element[] = [
        new AutoElement('bFunctionLength', 'Size of descriptor in bytes', 1, () => {
            return this.length();
        }),
        new ConstantElement('bDescriptorType', 'CS_INTERFACE descriptor type', 1, 0x24),
        new ConstantElement('bDescriptorSubtype', 'NCM functional descriptor subtype', 1, 0x1a),
        new VariableElement('bcdNcmVersion', 'NCM specification release number', 2, 'hex'),
        new BitmapElement('bmNetworkCapabilities', 'NCM network capabilities', 1, {
            'SetEthernetPacketFilter': 0x01,
            'Net Address': 0x02,
            'Encapsulated commands': 0x04,
            'Max Datagram Size': 0x08,
            'CRC Mode': 0x10,
            'NTB input size (8-byte)': 0x20,
        }),
    ];

    isValid(): boolean {
        return super.isValid();
    }
}

// USB Audio Class 2.0 class-specific descriptors. AC/AS interface descriptors
// use bDescriptorType 0x24 (CS_INTERFACE); the audio data endpoint uses 0x25.
//
// UAC2 bmControls are 2-bit-per-control fields (00 not present, 01 read-only,
// 11 host read/write). We model them as BitmapElements whose masks cover both
// bits of a control, so ticking a control sets it to host read/write (0b11) —
// much friendlier than raw hex, at the cost of not expressing the read-only
// (01) state. Spec: USB Audio 2.0 §4.

// Terminal types (USB Audio Terminal Types 2.0). Shared by Input/Output Terminal.
const audioTerminalTypeEnumValues: EnumValues = {
    'USB Undefined': 0x0100,
    'USB Streaming': 0x0101,
    'USB Vendor Specific': 0x01ff,
    'Input Undefined': 0x0200,
    'Microphone': 0x0201,
    'Desktop Microphone': 0x0202,
    'Personal Microphone': 0x0203,
    'Omni-directional Microphone': 0x0204,
    'Microphone Array': 0x0205,
    'Processing Microphone Array': 0x0206,
    'Output Undefined': 0x0300,
    'Speaker': 0x0301,
    'Headphones': 0x0302,
    'Head Mounted Display Audio': 0x0303,
    'Desktop Speaker': 0x0304,
    'Room Speaker': 0x0305,
    'Communication Speaker': 0x0306,
    'Low Frequency Effects Speaker': 0x0307,
    'Analog Connector': 0x0601,
    'Digital Audio Interface': 0x0602,
    'Line Connector': 0x0603,
};

// Format Type codes (USB Audio 2.0 Formats §2). Used by AS General bFormatType.
const audioFormatTypeEnumValues: EnumValues = {
    'Type I': 0x01,
    'Type II': 0x02,
    'Type III': 0x03,
    'Type IV': 0x04,
};

// Spatial locations bitmap (USB Audio 2.0 §4.1). Shared by bmChannelConfig fields.
const audioChannelConfigBitmapValues: Record<string, number> = {
    'Front Left (FL)': 0x00000001,
    'Front Right (FR)': 0x00000002,
    'Front Center (FC)': 0x00000004,
    'Low Frequency Effects (LFE)': 0x00000008,
    'Back Left (BL)': 0x00000010,
    'Back Right (BR)': 0x00000020,
    'Front Left of Center (FLC)': 0x00000040,
    'Front Right of Center (FRC)': 0x00000080,
    'Back Center (BC)': 0x00000100,
    'Side Left (SL)': 0x00000200,
    'Side Right (SR)': 0x00000400,
    'Top Center (TC)': 0x00000800,
};

// Supported Type I data formats bitmap (USB Audio 2.0 Formats §2.3.1.6).
const audioFormatsBitmapValues: Record<string, number> = {
    'PCM': 0x00000001,
    'PCM8': 0x00000002,
    'IEEE Float': 0x00000004,
    'A-Law': 0x00000008,
    'µ-Law': 0x00000010,
};

// Feature Unit per-channel controls (USB Audio 2.0 §4.7.2.8), 2 bits each.
const audioFeatureUnitControlBitmapValues: Record<string, number> = {
    'Mute': 0x00000003,
    'Volume': 0x0000000c,
    'Bass': 0x00000030,
    'Mid': 0x000000c0,
    'Treble': 0x00000300,
    'Graphic Equalizer': 0x00000c00,
    'Automatic Gain': 0x00003000,
    'Delay': 0x0000c000,
    'Bass Boost': 0x00030000,
    'Loudness': 0x000c0000,
    'Input Gain': 0x00300000,
    'Input Gain Pad': 0x00c00000,
    'Phase Inverter': 0x03000000,
    'Underflow': 0x0c000000,
    'Overflow': 0x30000000,
};

class AudioControlHeaderDescriptor extends Descriptor {
    readonly name = 'Audio Control Header';
    readonly elements: Element[] = [
        new AutoElement('bLength', 'Size of descriptor in bytes', 1, () => {
            return this.length();
        }),
        new ConstantElement('bDescriptorType', 'CS_INTERFACE descriptor type', 1, 0x24),
        new ConstantElement('bDescriptorSubtype', 'HEADER subtype', 1, 0x01),
        new VariableElement('bcdADC', 'Audio Device Class specification release number', 2, 'hex'),
        new VariableElement('bCategory', 'Audio function category', 1, 'hex'),
        new VariableElement('wTotalLength', 'Total length of the class-specific AC descriptors', 2, 'hex'),
        new BitmapElement('bmControls', 'Audio function controls', 1, {
            'Latency Control': 0x03,
        }),
    ];

    isValid(): boolean {
        return super.isValid();
    }
}

class AudioClockSourceDescriptor extends Descriptor {
    readonly name = 'Audio Clock Source';
    readonly elements: Element[] = [
        new AutoElement('bLength', 'Size of descriptor in bytes', 1, () => {
            return this.length();
        }),
        new ConstantElement('bDescriptorType', 'CS_INTERFACE descriptor type', 1, 0x24),
        new ConstantElement('bDescriptorSubtype', 'CLOCK_SOURCE subtype', 1, 0x0a),
        new VariableElement('bClockID', 'Clock Source entity ID', 1, 'dec'),
        // D1:0 together encode the clock type (00 external, 01 internal fixed,
        // 10 internal variable, 11 internal programmable); exposed here as raw bits.
        new BitmapElement('bmAttributes', 'Clock type attributes', 1, {
            'Internal Clock': 0x01,
            'Programmable Clock': 0x02,
            'Synchronized to SOF': 0x04,
        }),
        new BitmapElement('bmControls', 'Clock controls', 1, {
            'Clock Frequency Control': 0x03,
            'Clock Validity Control': 0x0c,
        }),
        new VariableElement('bAssocTerminal', 'Associated terminal ID', 1, 'dec'),
        new StringLinkElement('iClockSource', 'Clock Source name string descriptor', 1),
    ];

    isValid(): boolean {
        return super.isValid();
    }
}

class AudioClockSelectorDescriptor extends Descriptor {
    readonly name = 'Audio Clock Selector';
    readonly elements: Element[] = [
        new AutoElement('bLength', 'Size of descriptor in bytes', 1, () => {
            return this.length();
        }),
        new ConstantElement('bDescriptorType', 'CS_INTERFACE descriptor type', 1, 0x24),
        new ConstantElement('bDescriptorSubtype', 'CLOCK_SELECTOR subtype', 1, 0x0b),
        new VariableElement('bClockID', 'Clock Selector entity ID', 1, 'dec'),
        new VariableElement('bNrInPins', 'Number of input pins', 1, 'dec'),
        new VariableElement('baCSourceID1', 'Clock entity ID of input pin 1', 1, 'dec'),
        new BitmapElement('bmControls', 'Clock selector controls', 1, {
            'Clock Selector Control': 0x03,
        }),
        new StringLinkElement('iClockSelector', 'Clock Selector name string descriptor', 1),
    ];

    isValid(): boolean {
        return super.isValid();
    }
}

class AudioClockMultiplierDescriptor extends Descriptor {
    readonly name = 'Audio Clock Multiplier';
    readonly elements: Element[] = [
        new AutoElement('bLength', 'Size of descriptor in bytes', 1, () => {
            return this.length();
        }),
        new ConstantElement('bDescriptorType', 'CS_INTERFACE descriptor type', 1, 0x24),
        new ConstantElement('bDescriptorSubtype', 'CLOCK_MULTIPLIER subtype', 1, 0x0c),
        new VariableElement('bClockID', 'Clock Multiplier entity ID', 1, 'dec'),
        new VariableElement('bCSourceID', 'Input clock entity ID', 1, 'dec'),
        new BitmapElement('bmControls', 'Clock multiplier controls', 1, {
            'Clock Numerator Control': 0x03,
            'Clock Denominator Control': 0x0c,
        }),
        new StringLinkElement('iClockMultiplier', 'Clock Multiplier name string descriptor', 1),
    ];

    isValid(): boolean {
        return super.isValid();
    }
}

class AudioInputTerminalDescriptor extends Descriptor {
    readonly name = 'Audio Input Terminal';
    readonly elements: Element[] = [
        new AutoElement('bLength', 'Size of descriptor in bytes', 1, () => {
            return this.length();
        }),
        new ConstantElement('bDescriptorType', 'CS_INTERFACE descriptor type', 1, 0x24),
        new ConstantElement('bDescriptorSubtype', 'INPUT_TERMINAL subtype', 1, 0x02),
        new VariableElement('bTerminalID', 'Input Terminal entity ID', 1, 'dec'),
        new EnumElement('wTerminalType', 'Terminal type', 2, audioTerminalTypeEnumValues),
        new VariableElement('bAssocTerminal', 'Associated output terminal ID', 1, 'dec'),
        new VariableElement('bCSourceID', 'Clock entity ID', 1, 'dec'),
        new VariableElement('bNrChannels', 'Number of logical output channels', 1, 'dec'),
        new BitmapElement('bmChannelConfig', 'Spatial channel locations', 4, audioChannelConfigBitmapValues),
        new StringLinkElement('iChannelNames', 'First channel name string descriptor', 1),
        new BitmapElement('bmControls', 'Terminal controls', 2, {
            'Copy Protect Control': 0x0003,
            'Connector Control': 0x000c,
            'Overload Control': 0x0030,
            'Cluster Control': 0x00c0,
            'Underflow Control': 0x0300,
            'Overflow Control': 0x0c00,
        }),
        new StringLinkElement('iTerminal', 'Terminal name string descriptor', 1),
    ];

    isValid(): boolean {
        return super.isValid();
    }
}

class AudioOutputTerminalDescriptor extends Descriptor {
    readonly name = 'Audio Output Terminal';
    readonly elements: Element[] = [
        new AutoElement('bLength', 'Size of descriptor in bytes', 1, () => {
            return this.length();
        }),
        new ConstantElement('bDescriptorType', 'CS_INTERFACE descriptor type', 1, 0x24),
        new ConstantElement('bDescriptorSubtype', 'OUTPUT_TERMINAL subtype', 1, 0x03),
        new VariableElement('bTerminalID', 'Output Terminal entity ID', 1, 'dec'),
        new EnumElement('wTerminalType', 'Terminal type', 2, audioTerminalTypeEnumValues),
        new VariableElement('bAssocTerminal', 'Associated input terminal ID', 1, 'dec'),
        new VariableElement('bSourceID', 'ID of the unit/terminal feeding this output', 1, 'dec'),
        new VariableElement('bCSourceID', 'Clock entity ID', 1, 'dec'),
        new BitmapElement('bmControls', 'Terminal controls', 2, {
            'Copy Protect Control': 0x0003,
            'Connector Control': 0x000c,
            'Overload Control': 0x0030,
            'Underflow Control': 0x00c0,
            'Overflow Control': 0x0300,
        }),
        new StringLinkElement('iTerminal', 'Terminal name string descriptor', 1),
    ];

    isValid(): boolean {
        return super.isValid();
    }
}

class AudioFeatureUnitDescriptor extends Descriptor {
    // Modelled for a master channel plus one logical channel (14 bytes). The
    // spec length is 6 + (bNrChannels + 1) * 4.
    readonly name = 'Audio Feature Unit';
    readonly elements: Element[] = [
        new AutoElement('bLength', 'Size of descriptor in bytes', 1, () => {
            return this.length();
        }),
        new ConstantElement('bDescriptorType', 'CS_INTERFACE descriptor type', 1, 0x24),
        new ConstantElement('bDescriptorSubtype', 'FEATURE_UNIT subtype', 1, 0x06),
        new VariableElement('bUnitID', 'Feature Unit entity ID', 1, 'dec'),
        new VariableElement('bSourceID', 'ID of the unit/terminal feeding this unit', 1, 'dec'),
        new BitmapElement('bmaControls0', 'Master channel controls', 4, audioFeatureUnitControlBitmapValues),
        new BitmapElement('bmaControls1', 'Logical channel 1 controls', 4, audioFeatureUnitControlBitmapValues),
        new StringLinkElement('iFeature', 'Feature Unit name string descriptor', 1),
    ];

    isValid(): boolean {
        return super.isValid();
    }
}

class AudioSelectorUnitDescriptor extends Descriptor {
    readonly name = 'Audio Selector Unit';
    readonly elements: Element[] = [
        new AutoElement('bLength', 'Size of descriptor in bytes', 1, () => {
            return this.length();
        }),
        new ConstantElement('bDescriptorType', 'CS_INTERFACE descriptor type', 1, 0x24),
        new ConstantElement('bDescriptorSubtype', 'SELECTOR_UNIT subtype', 1, 0x05),
        new VariableElement('bUnitID', 'Selector Unit entity ID', 1, 'dec'),
        new VariableElement('bNrInPins', 'Number of input pins', 1, 'dec'),
        new VariableElement('baSourceID1', 'ID of the unit/terminal on input pin 1', 1, 'dec'),
        new BitmapElement('bmControls', 'Selector controls', 1, {
            'Selector Control': 0x03,
        }),
        new StringLinkElement('iSelector', 'Selector Unit name string descriptor', 1),
    ];

    isValid(): boolean {
        return super.isValid();
    }
}

class AudioSamplingRateConverterDescriptor extends Descriptor {
    readonly name = 'Audio Sampling Rate Converter';
    readonly elements: Element[] = [
        new AutoElement('bLength', 'Size of descriptor in bytes', 1, () => {
            return this.length();
        }),
        new ConstantElement('bDescriptorType', 'CS_INTERFACE descriptor type', 1, 0x24),
        new ConstantElement('bDescriptorSubtype', 'SAMPLE_RATE_CONVERTER subtype', 1, 0x0d),
        new VariableElement('bUnitID', 'Sampling Rate Converter entity ID', 1, 'dec'),
        new VariableElement('bSourceID', 'ID of the unit/terminal feeding this unit', 1, 'dec'),
        new VariableElement('bCSourceInID', 'Input clock entity ID', 1, 'dec'),
        new VariableElement('bCSourceOutID', 'Output clock entity ID', 1, 'dec'),
        new StringLinkElement('iSRC', 'Sampling Rate Converter name string descriptor', 1),
    ];

    isValid(): boolean {
        return super.isValid();
    }
}

class AudioStreamingGeneralDescriptor extends Descriptor {
    readonly name = 'Audio Streaming General';
    readonly elements: Element[] = [
        new AutoElement('bLength', 'Size of descriptor in bytes', 1, () => {
            return this.length();
        }),
        new ConstantElement('bDescriptorType', 'CS_INTERFACE descriptor type', 1, 0x24),
        new ConstantElement('bDescriptorSubtype', 'AS_GENERAL subtype', 1, 0x01),
        new VariableElement('bTerminalLink', 'Connected terminal ID', 1, 'dec'),
        new BitmapElement('bmControls', 'AS interface controls', 1, {
            'Active Alternate Setting Control': 0x03,
            'Valid Alternate Settings Control': 0x0c,
        }),
        new EnumElement('bFormatType', 'Format type', 1, audioFormatTypeEnumValues),
        new BitmapElement('bmFormats', 'Supported audio data formats', 4, audioFormatsBitmapValues),
        new VariableElement('bNrChannels', 'Number of physical channels', 1, 'dec'),
        new BitmapElement('bmChannelConfig', 'Spatial channel locations', 4, audioChannelConfigBitmapValues),
        new StringLinkElement('iChannelNames', 'First channel name string descriptor', 1),
    ];

    isValid(): boolean {
        return super.isValid();
    }
}

class AudioStreamingFormatTypeIDescriptor extends Descriptor {
    readonly name = 'Audio Streaming Format Type I';
    readonly elements: Element[] = [
        new AutoElement('bLength', 'Size of descriptor in bytes', 1, () => {
            return this.length();
        }),
        new ConstantElement('bDescriptorType', 'CS_INTERFACE descriptor type', 1, 0x24),
        new ConstantElement('bDescriptorSubtype', 'FORMAT_TYPE subtype', 1, 0x02),
        new ConstantElement('bFormatType', 'FORMAT_TYPE_I', 1, 0x01),
        new VariableElement('bSubslotSize', 'Bytes per audio subslot', 1, 'dec'),
        new VariableElement('bBitResolution', 'Valid bits per sample', 1, 'dec'),
    ];

    isValid(): boolean {
        return super.isValid();
    }
}

class AudioDataEndpointDescriptor extends Descriptor {
    readonly name = 'Audio Data Endpoint';
    readonly elements: Element[] = [
        new AutoElement('bLength', 'Size of descriptor in bytes', 1, () => {
            return this.length();
        }),
        new ConstantElement('bDescriptorType', 'CS_ENDPOINT descriptor type', 1, 0x25),
        new ConstantElement('bDescriptorSubtype', 'EP_GENERAL subtype', 1, 0x01),
        new BitmapElement('bmAttributes', 'Endpoint attributes', 1, {
            'Max Packets Only': 0x80,
        }),
        new BitmapElement('bmControls', 'Endpoint controls', 1, {
            'Pitch Control': 0x03,
            'Data Overrun Control': 0x0c,
            'Data Underrun Control': 0x30,
        }),
        new EnumElement('bLockDelayUnits', 'Units of wLockDelay', 1, {
            'Undefined': 0x00,
            'Milliseconds': 0x01,
            'Decoded PCM samples': 0x02,
        }),
        new VariableElement('wLockDelay', 'Time to lock the endpoint', 2, 'dec'),
    ];

    isValid(): boolean {
        return super.isValid();
    }
}

// Mass Storage Bulk-Only Transport wrappers. These are transport structs, not
// USB descriptors, so they carry no bLength and are used as root structures.
class CommandBlockWrapper extends Descriptor {
    readonly name = 'Command Block Wrapper (CBW)';
    readonly elements: Element[] = [
        new ConstantElement('dCBWSignature', 'CBW signature ("USBC")', 4, 0x43425355),
        new VariableElement('dCBWTag', 'Command block tag (echoed in the CSW)', 4, 'hex'),
        new VariableElement('dCBWDataTransferLength', 'Bytes transferred in the data stage', 4, 'dec'),
        new BitmapElement('bmCBWFlags', 'Flags', 1, {
            'Data-In (device to host)': 0x80,
        }),
        new VariableElement('bCBWLUN', 'Target logical unit number', 1, 'dec'),
        new VariableElement('bCBWCBLength', 'Length of the command block (1-16)', 1, 'dec'),
        new ConstantElement('CBWCB', 'Command block (SCSI CDB); filled at runtime', 16, 0),
    ];

    isValid(): boolean {
        return super.isValid();
    }
}

class CommandStatusWrapper extends Descriptor {
    readonly name = 'Command Status Wrapper (CSW)';
    readonly elements: Element[] = [
        new ConstantElement('dCSWSignature', 'CSW signature ("USBS")', 4, 0x53425355),
        new VariableElement('dCSWTag', 'Tag echoing the CBW tag', 4, 'hex'),
        new VariableElement('dCSWDataResidue', 'Difference between expected and actual transfer', 4, 'dec'),
        new EnumElement('bCSWStatus', 'Command status', 1, {
            'Command Passed': 0x00,
            'Command Failed': 0x01,
            'Phase Error': 0x02,
        }),
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
    CDCHeaderFunctionalDescriptor,
    CDCUnionFunctionalDescriptor,
    CDCCallManagementFunctionalDescriptor,
    CDCAbstractControlManagementDescriptor,
    CDCEthernetNetworkingFunctionalDescriptor,
    CDCNCMFunctionalDescriptor,
    CommandBlockWrapper,
    CommandStatusWrapper,
    AudioControlHeaderDescriptor,
    AudioClockSourceDescriptor,
    AudioClockSelectorDescriptor,
    AudioClockMultiplierDescriptor,
    AudioInputTerminalDescriptor,
    AudioOutputTerminalDescriptor,
    AudioFeatureUnitDescriptor,
    AudioSelectorUnitDescriptor,
    AudioSamplingRateConverterDescriptor,
    AudioStreamingGeneralDescriptor,
    AudioStreamingFormatTypeIDescriptor,
    AudioDataEndpointDescriptor,
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
        case 'CDC Header Functional Descriptor':
            return new CDCHeaderFunctionalDescriptor();
        case 'CDC Union Functional Descriptor':
            return new CDCUnionFunctionalDescriptor();
        case 'CDC Call Management Functional Descriptor':
            return new CDCCallManagementFunctionalDescriptor();
        case 'CDC Abstract Control Management Descriptor':
            return new CDCAbstractControlManagementDescriptor();
        case 'CDC Ethernet Networking Functional Descriptor':
            return new CDCEthernetNetworkingFunctionalDescriptor();
        case 'CDC NCM Functional Descriptor':
            return new CDCNCMFunctionalDescriptor();
        case 'Command Block Wrapper (CBW)':
            return new CommandBlockWrapper();
        case 'Command Status Wrapper (CSW)':
            return new CommandStatusWrapper();
        case 'Audio Control Header':
            return new AudioControlHeaderDescriptor();
        case 'Audio Clock Source':
            return new AudioClockSourceDescriptor();
        case 'Audio Clock Selector':
            return new AudioClockSelectorDescriptor();
        case 'Audio Clock Multiplier':
            return new AudioClockMultiplierDescriptor();
        case 'Audio Input Terminal':
            return new AudioInputTerminalDescriptor();
        case 'Audio Output Terminal':
            return new AudioOutputTerminalDescriptor();
        case 'Audio Feature Unit':
            return new AudioFeatureUnitDescriptor();
        case 'Audio Selector Unit':
            return new AudioSelectorUnitDescriptor();
        case 'Audio Sampling Rate Converter':
            return new AudioSamplingRateConverterDescriptor();
        case 'Audio Streaming General':
            return new AudioStreamingGeneralDescriptor();
        case 'Audio Streaming Format Type I':
            return new AudioStreamingFormatTypeIDescriptor();
        case 'Audio Data Endpoint':
            return new AudioDataEndpointDescriptor();
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
    'Command Block Wrapper (CBW)',
    'Command Status Wrapper (CSW)',
];

export {
    createDescriptorByType,
    rootDescriptorTypes,
};
