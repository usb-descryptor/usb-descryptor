import { describe, it, expect } from 'vitest'
import { createDescriptorByType, InterfaceDescriptor } from '../descriptors'
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
})
