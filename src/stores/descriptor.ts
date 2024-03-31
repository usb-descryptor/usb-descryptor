import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import {
    Descriptor,
    DeviceDescriptor,
    ConfigurationDescriptor,
    StringDescriptor,
    StringZeroDescriptor,
    createDescriptorByType,
} from '../usb/descriptors';

export const useDescriptorStore = defineStore('descriptor', () => {
  const descriptors = ref<Descriptor[]>([])

  descriptors.value.push(new DeviceDescriptor);
  descriptors.value.push(new StringZeroDescriptor);
  descriptors.value.push(new ConfigurationDescriptor);
  
  function addDescriptor(type: string) {
    const descriptor = createDescriptorByType(type);
    descriptors.value.push(descriptor);

    updateElements();
    assignIndices();
  }

  function removeDescriptorFromList(descriptors: Descriptor[], victim: Descriptor) {
    const index = descriptors.indexOf(victim);

    if (index > -1) {
        descriptors.splice(index, 1);
    } else {
        for (const descriptor of descriptors)
        removeDescriptorFromList(descriptor.children, victim);
    }
  }

  function removeDescriptor(descriptor: Descriptor) {
    removeDescriptorFromList(descriptors.value, descriptor);

    updateElements();
    assignIndices();
  }

  function updateElements() {
    const stringDescriptors: StringDescriptor[] = [];

    for (const descriptor of descriptors.value) {
        if (descriptor instanceof StringDescriptor)
        stringDescriptors.push(descriptor);
    }

    for (const descriptor of descriptors.value) {
        descriptor.updateAutoElements();
        descriptor.updateStringLinkElements(stringDescriptors);
    }
  }

  function dumpJSON(): string {
    const v = {
        date: new Date(),
        descryptor_version: 'fixme',
        descriptors: descriptors.value,
    }

    return JSON.stringify(v, null, 2);
  }

  function assignIndices() {
    const indidcesForType = new Map<string, number>();

    // String descriptors start with index 1
    indidcesForType.set('StringDescriptor', 1);

    for (const descriptor of descriptors.value) {
        const type = descriptor.constructor.name;
        if (!indidcesForType.has(type)) {
            indidcesForType.set(type, 0);
        }

        descriptor.index = indidcesForType.get(type)!;
        indidcesForType.set(type, indidcesForType.get(type)! + 1);
        console.log(type);
    }
  }

  updateElements();
  assignIndices();

  return { descriptors, addDescriptor, removeDescriptor, dumpJSON, updateElements }
})
