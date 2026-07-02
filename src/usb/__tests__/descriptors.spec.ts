import { describe, it, expect } from 'vitest'
import {
    createDescriptorByType,
    InterfaceDescriptor,
    EndpointDescriptor,
    rootDescriptorTypes
} from '../descriptors'
import { EnumElement, type Element } from '../elements'

function field(elements: Element[], name: string): Element | undefined {
    return elements.find((e) => e.name === name)
}

// Verified CDC functional descriptors (see docs/usb-class-descriptors-reference.md
// §3.2/3.3): bDescriptorType = 0x24 (CS_INTERFACE), fixed bDescriptorSubtype,
// and a fixed total length.
const CDC_DESCRIPTORS = [
    { type: 'CDC Header Functional Descriptor', subtype: 0x00, length: 5 },
    { type: 'CDC Union Functional Descriptor', subtype: 0x06, length: 5 },
    { type: 'CDC Call Management Functional Descriptor', subtype: 0x01, length: 5 },
    { type: 'CDC Abstract Control Management Descriptor', subtype: 0x02, length: 4 },
    { type: 'CDC Ethernet Networking Functional Descriptor', subtype: 0x0f, length: 13 },
    { type: 'CDC NCM Functional Descriptor', subtype: 0x1a, length: 6 }
]

describe('CDC functional descriptors', () => {
    for (const { type, subtype, length } of CDC_DESCRIPTORS) {
        describe(type, () => {
            it('is constructible via the factory', () => {
                expect(createDescriptorByType(type).name).toBe(type)
            })

            it('uses CS_INTERFACE (0x24) as bDescriptorType', () => {
                const d = createDescriptorByType(type)
                expect(field(d.elements, 'bDescriptorType')?.value).toBe(0x24)
            })

            it(`uses bDescriptorSubtype 0x${subtype.toString(16)}`, () => {
                const d = createDescriptorByType(type)
                expect(field(d.elements, 'bDescriptorSubtype')?.value).toBe(subtype)
            })

            it(`is ${length} bytes long`, () => {
                expect(createDescriptorByType(type).length()).toBe(length)
            })
        })
    }

    it('can be added under an Interface Descriptor', () => {
        const iface = new InterfaceDescriptor()
        for (const { type } of CDC_DESCRIPTORS) {
            expect(iface.canHaveChildType(type)).toBe(true)
        }
    })
})

describe('Interface Descriptor', () => {
    it('starts with an auto-computed bLength and is 9 bytes', () => {
        const iface = new InterfaceDescriptor()
        iface.updateAutoElements()
        expect(iface.elements[0].name).toBe('bLength')
        expect(iface.length()).toBe(9)
        expect(iface.elements[0].value).toBe(9)
    })
})

describe('Interface Descriptor subclass', () => {
    it('exposes bInterfaceSubClass as an enum including the CDC communication models', () => {
        const sub = field(new InterfaceDescriptor().elements, 'bInterfaceSubClass')
        expect(sub).toBeInstanceOf(EnumElement)
        const values = Object.values((sub as EnumElement).enumValues)
        expect(values).toEqual(expect.arrayContaining([0x02, 0x06, 0x0d])) // ACM, ECM, NCM
    })

    it('includes both CDC and MSC command-set codes, labeled by class', () => {
        const sub = field(new InterfaceDescriptor().elements, 'bInterfaceSubClass') as EnumElement
        const keys = Object.keys(sub.enumValues)
        expect(keys.some((k) => k.startsWith('CDC:'))).toBe(true)
        expect(keys.some((k) => k.startsWith('MSC:'))).toBe(true)
    })

    it('exposes bInterfaceProtocol as an enum including Bulk-Only Transport (0x50)', () => {
        const proto = field(new InterfaceDescriptor().elements, 'bInterfaceProtocol')
        expect(proto).toBeInstanceOf(EnumElement)
        expect(Object.values((proto as EnumElement).enumValues)).toContain(0x50)
    })
})

// USB Audio Class 2.0 (docs/usb-class-descriptors-reference.md §1). AC/AS
// interface descriptors use bDescriptorType 0x24 (CS_INTERFACE); the audio data
// endpoint uses 0x25 (CS_ENDPOINT).
const UAC2_DESCRIPTORS = [
    { type: 'Audio Control Header', dtype: 0x24, subtype: 0x01, length: 9, under: 'interface' },
    { type: 'Audio Clock Source', dtype: 0x24, subtype: 0x0a, length: 8, under: 'interface' },
    { type: 'Audio Clock Selector', dtype: 0x24, subtype: 0x0b, length: 8, under: 'interface' },
    { type: 'Audio Clock Multiplier', dtype: 0x24, subtype: 0x0c, length: 7, under: 'interface' },
    { type: 'Audio Input Terminal', dtype: 0x24, subtype: 0x02, length: 17, under: 'interface' },
    { type: 'Audio Output Terminal', dtype: 0x24, subtype: 0x03, length: 12, under: 'interface' },
    { type: 'Audio Feature Unit', dtype: 0x24, subtype: 0x06, length: 14, under: 'interface' },
    { type: 'Audio Selector Unit', dtype: 0x24, subtype: 0x05, length: 8, under: 'interface' },
    { type: 'Audio Sampling Rate Converter', dtype: 0x24, subtype: 0x0d, length: 8, under: 'interface' },
    { type: 'Audio Streaming General', dtype: 0x24, subtype: 0x01, length: 16, under: 'interface' },
    { type: 'Audio Streaming Format Type I', dtype: 0x24, subtype: 0x02, length: 6, under: 'interface' },
    { type: 'Audio Data Endpoint', dtype: 0x25, subtype: 0x01, length: 8, under: 'endpoint' }
]

describe('USB Audio Class 2.0 descriptors', () => {
    for (const { type, dtype, subtype, length } of UAC2_DESCRIPTORS) {
        describe(type, () => {
            it('is constructible via the factory', () => {
                expect(createDescriptorByType(type).name).toBe(type)
            })

            it(`uses bDescriptorType 0x${dtype.toString(16)}`, () => {
                expect(field(createDescriptorByType(type).elements, 'bDescriptorType')?.value).toBe(dtype)
            })

            it(`uses bDescriptorSubtype 0x${subtype.toString(16)}`, () => {
                expect(field(createDescriptorByType(type).elements, 'bDescriptorSubtype')?.value).toBe(subtype)
            })

            it(`is ${length} bytes long`, () => {
                expect(createDescriptorByType(type).length()).toBe(length)
            })
        })
    }

    it('AC/AS interface descriptors are addable under an Interface Descriptor', () => {
        const iface = new InterfaceDescriptor()
        for (const { type, under } of UAC2_DESCRIPTORS) {
            if (under === 'interface') expect(iface.canHaveChildType(type)).toBe(true)
        }
    })

    it('the audio data endpoint is addable under an Endpoint Descriptor', () => {
        expect(new EndpointDescriptor().canHaveChildType('Audio Data Endpoint')).toBe(true)
    })

    it('the interface subclass enum includes the audio subclasses', () => {
        const sub = field(new InterfaceDescriptor().elements, 'bInterfaceSubClass') as EnumElement
        expect(Object.keys(sub.enumValues).some((k) => k.startsWith('Audio:'))).toBe(true)
    })
})

describe('Mass Storage transport structs', () => {
    it('CBW is 31 bytes with the "USBC" signature', () => {
        const cbw = createDescriptorByType('Command Block Wrapper (CBW)')
        expect(cbw.length()).toBe(31)
        const sig = field(cbw.elements, 'dCBWSignature')!
        expect(Array.from(sig.toByteArray())).toEqual([0x55, 0x53, 0x42, 0x43])
    })

    it('CSW is 13 bytes with the "USBS" signature', () => {
        const csw = createDescriptorByType('Command Status Wrapper (CSW)')
        expect(csw.length()).toBe(13)
        const sig = field(csw.elements, 'dCSWSignature')!
        expect(Array.from(sig.toByteArray())).toEqual([0x55, 0x53, 0x42, 0x53])
    })

    it('are available as root-level structures', () => {
        expect(rootDescriptorTypes).toEqual(
            expect.arrayContaining(['Command Block Wrapper (CBW)', 'Command Status Wrapper (CSW)'])
        )
    })
})
