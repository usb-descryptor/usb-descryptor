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
})
