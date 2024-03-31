<script setup lang="ts">
import TreeViewDescriptor from './TreeViewDescriptor.vue';
import { Descriptor, rootDescriptorTypes } from '../usb/descriptors';
import { NFlex, NDropdown, NButton, useMessage } from 'naive-ui';
import { Add16Filled } from '@vicons/fluent';
import { Icon } from '@vicons/utils';

import { useDescriptorStore } from '@/stores/descriptor'
const store = useDescriptorStore();

const emits = defineEmits([
    'selected',
]);

function possibleRootDescriptors() {
    return rootDescriptorTypes.map(type => ({
        label: type,
        key: type
    }));
}

const message = useMessage();

function addDescriptor(type: string) {
    store.addDescriptor(type);
    message.info(`Added ${type}`);
}
</script>

<template>
    <h2>Descriptor tree</h2>

    <div class="tree">
        <div v-for="descriptor in store.descriptors" :key="descriptor.name">
            <TreeViewDescriptor :descriptor="descriptor" @selected="$emit('selected', $event)" />
        </div>
    </div>

    <n-dropdown trigger="click" :options="possibleRootDescriptors()" @select="addDescriptor">
        <n-button size="small" style="margin-top: 1rem;">
            <Icon size="16" style="margin-right: 0.3rem">
                <Add16Filled />
            </Icon>
            Add root descriptor
        </n-button>
    </n-dropdown>
</template>

<style scoped>
.tree {
    margin-top: .5rem;
}
</style>
