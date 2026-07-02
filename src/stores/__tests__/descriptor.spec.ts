import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDescriptorStore } from '../descriptor'

describe('descriptor store', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
    })

    it('addDescriptor returns the newly added descriptor so callers can select it', () => {
        const store = useDescriptorStore()
        const added = store.addDescriptor('String Descriptor')
        expect(added.name).toBe('String Descriptor')
        expect(store.descriptors[store.descriptors.length - 1]).toBe(added)
    })

    it('loadJSON reconstructs the tree a dumpJSON export produced', () => {
        const store = useDescriptorStore()

        // Mutate: edit a value, add a nested child, add a string.
        const device = store.descriptors.find((d) => d.name === 'Device Descriptor')!
        device.elements.find((e) => e.name === 'idVendor')!.value = 0x1234

        const iface = store.addDescriptor('Interface Descriptor')
        iface.addChild('CDC Header Functional Descriptor')

        const str = store.addDescriptor('String Descriptor')
        str.elements.find((e) => e.name === 'bString')!.value = 'Hello'

        const json = store.dumpJSON()

        // Load into a fresh store and compare.
        setActivePinia(createPinia())
        const restored = useDescriptorStore()
        restored.loadJSON(json)

        expect(restored.descriptors.map((d) => d.name)).toEqual(store.descriptors.map((d) => d.name))

        const device2 = restored.descriptors.find((d) => d.name === 'Device Descriptor')!
        expect(device2.elements.find((e) => e.name === 'idVendor')!.value).toBe(0x1234)

        const iface2 = restored.descriptors.find((d) => d.name === 'Interface Descriptor')!
        expect(iface2.children.map((c) => c.name)).toEqual(['CDC Header Functional Descriptor'])

        const str2 = restored.descriptors.find((d) => d.name === 'String Descriptor')!
        expect(str2.elements.find((e) => e.name === 'bString')!.value).toBe('Hello')
    })

    it('loadJSON rejects an unknown descriptor type', () => {
        const store = useDescriptorStore()
        const bad = JSON.stringify({ descriptors: [{ name: 'Bogus Descriptor', elements: [], children: [] }] })
        expect(() => store.loadJSON(bad)).toThrow(/Bogus Descriptor/)
    })
})
