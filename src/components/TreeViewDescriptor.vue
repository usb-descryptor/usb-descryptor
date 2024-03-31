<script setup lang="ts">
import { ref } from 'vue'
import { Descriptor } from '../usb/descriptors'
import { NFlex, NDropdown, NButton, useMessage } from 'naive-ui';
import { Add16Filled, Delete16Regular, CircleSmall20Filled, Warning16Filled } from '@vicons/fluent';
import { Icon } from '@vicons/utils';

import { useDescriptorStore } from '@/stores/descriptor'
const store = useDescriptorStore();

const props = defineProps<{
    descriptor: Descriptor
}>()

function possibleChildren() {
    return props.descriptor.possibleChildTypes.map(type => ({
        label: type,
        key: type
    }));
}

const message = useMessage();

function addChild(type: string) {
    props.descriptor.addChild(type);
    message.info(`Added ${type} to ${props.descriptor.name}`);
}

</script>

<template>
    <n-flex>
        <div>
            <Icon size="16">
                <CircleSmall20Filled />
            </Icon>

            <a @click="$emit('selected', ref(descriptor))">
                {{ descriptor.name }} #{{ descriptor.index }} ({{ descriptor.length() }} bytes)
            </a>
        </div>

        <div>
            <n-button size="small" @click="store.removeDescriptor(descriptor)">
                <Icon size="16">
                    <Delete16Regular />
                </Icon>
            </n-button>
        </div>

        <div>
            <n-dropdown trigger="click" :options="possibleChildren()" @select="addChild"
                v-if="descriptor.possibleChildTypes.length > 0">
                <n-button size="small">
                    <Icon size="16" style="margin-right: 0.3rem;">
                        <Add16Filled />
                    </Icon>
                    Add child
                </n-button>
            </n-dropdown>
        </div>
    </n-flex>

    <div style="margin-left: 2rem;">
        <div v-for="d in descriptor.children " :key="d.name">
            <TreeViewDescriptor :descriptor="d" @selected="$emit('selected', $event)" />
        </div>
    </div>
</template>

<style scoped></style>
