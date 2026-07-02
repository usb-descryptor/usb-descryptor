import { ref } from 'vue'
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
  
  function addDescriptor(type: string): Descriptor {
    descriptors.value.push(createDescriptorByType(type));

    updateElements();
    assignIndices();

    // Return the reactive instance from the store (not the raw object just
    // created) so callers can select it for editing.
    return descriptors.value[descriptors.value.length - 1];
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

  // Rebuild a descriptor (and its subtree) from the { name, elements, children }
  // shape produced by Descriptor.toJSON(). Element values are copied by name onto
  // a fresh descriptor of that type; auto/index values are recomputed afterwards.
  interface SerializedElement { name: string; value: unknown }
  interface SerializedDescriptor { name: string; elements?: SerializedElement[]; children?: SerializedDescriptor[] }

  function reconstructDescriptor(data: SerializedDescriptor): Descriptor {
    const descriptor = createDescriptorByType(data.name);

    for (const saved of data.elements ?? []) {
        const target = descriptor.elements.find(element => element.name === saved.name);
        if (target) {
            target.value = saved.value;
        }
    }

    for (const child of data.children ?? []) {
        descriptor.children.push(reconstructDescriptor(child));
    }

    return descriptor;
  }

  function loadJSON(json: string): void {
    const parsed = JSON.parse(json);
    const restored = (parsed.descriptors ?? []).map(reconstructDescriptor);

    descriptors.value = restored;

    updateElements();
    assignIndices();
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
    }
  }

  updateElements();
  assignIndices();

  return { descriptors, addDescriptor, removeDescriptor, dumpJSON, loadJSON, updateElements }
})
