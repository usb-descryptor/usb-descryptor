<script setup lang="ts">
import { Descriptor } from '../usb/descriptors'
import { NFlex, NDropdown, NButton, useMessage } from 'naive-ui';
import { Add16Filled, Delete16Regular, CircleSmall20Filled } from '@vicons/fluent';
import { Icon } from '@vicons/utils';

import { useDescriptorStore } from '@/stores/descriptor'
const store = useDescriptorStore();

const props = defineProps<{
    descriptor: Descriptor,
    selected: Descriptor | null,
}>()

const emit = defineEmits(['selected']);

function possibleChildren() {
    return props.descriptor.possibleChildTypes.map(type => ({
        label: type,
        key: type
    }));
}

const message = useMessage();

function addChild(type: string) {
    const child = props.descriptor.addChild(type);
    message.info(`Added ${type} to ${props.descriptor.name}`);
    emit('selected', child);
}

</script>

<template>
    <n-flex class="node" :class="{ active: descriptor === selected }" align="center">
        <div>
            <Icon size="16">
                <CircleSmall20Filled />
            </Icon>

            <a class="node-name" @click="$emit('selected', descriptor)">
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

    <div class="children" v-if="descriptor.children.length > 0">
        <div class="child" v-for="d in descriptor.children" :key="d.name">
            <TreeViewDescriptor :descriptor="d" :selected="selected" @selected="$emit('selected', $event)" />
        </div>
    </div>
</template>

<style scoped>
.node {
    border-radius: 4px;
    padding: 1px 6px;
    border-left: 3px solid transparent;
}

.node.active {
    background: rgba(99, 226, 183, 0.14);
    border-left-color: #63e2b7;
}

.node-name {
    cursor: pointer;
}

.node.active .node-name {
    font-weight: 600;
}

/* Nested children get a vertical guide line with a connector per child. */
.children {
    margin-left: 0.6rem;
    padding-left: 1rem;
    border-left: 1px solid rgba(128, 128, 128, 0.35);
}

.child {
    position: relative;
}

.child::before {
    content: '';
    position: absolute;
    left: -1rem;
    top: 0.85rem;
    width: 0.75rem;
    height: 1px;
    background: rgba(128, 128, 128, 0.35);
}
</style>
