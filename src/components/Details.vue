<script setup lang="ts">
import type { Ref } from 'vue'
import { NGrid, NGi, NInput, NInputNumber, NSelect, NCheckbox } from 'naive-ui'
import type { FormValidationStatus } from 'naive-ui/lib/form/src/interface';
import {
    Element,
    AutoElement,
    ConstantElement,
    VariableElement,
    EnumElement,
    BitmapElement,
    StringElement,
} from '../usb/elements';
import { Descriptor } from '../usb/descriptors';

import { useDescriptorStore } from '@/stores/descriptor';
const store = useDescriptorStore();

const props = defineProps<{
    descriptor: Ref<Descriptor> | null,
}>()

function inputStatus(element: Element): FormValidationStatus | undefined {
    return element.isValid() ? undefined : "error";
}

function parseHex(input: string): number | null {
    return parseInt(input, 16);
}

function formatHex(input: number | null): string {
    if (input)
        return input.toString(16);

    return "";
}

function enumSelectValues(element: EnumElement) {
    return Object.keys(element.enumValues).map(key => ({
        label: key + ' (0x' + element.enumValues[key].toString(16) + ')',
        value: element.enumValues[key]
    }))
}

function bitMapChecked(element: BitmapElement, key: number) {
    return (element.value & key) !== 0
}

function updateBitmap(element: BitmapElement, key: number, on: boolean) {
    if (on) {
        element.value |= key
    } else {
        element.value &= ~key
    }
}
</script>

<template>
    <div v-if="descriptor !== null">
        <n-grid x-gap="1" y-gap="10" :cols="3" layout-shift-disabled>
            <n-gi span="3">
                <h2>{{ descriptor.value.name }} #{{ descriptor.value.index }}</h2>
            </n-gi>

            <template v-for="element in descriptor.value.elements" :key="element.id">
                <n-gi>
                    {{ element.name }}
                    <p class="comment" v-if="element.size == 1">
                        1 byte
                    </p>
                    <p class="comment" v-else>
                        {{ element.size }} bytes
                    </p>

                </n-gi>
                <n-gi span="2">
                    <n-input-number v-if="element instanceof VariableElement && element.format == 'dec'"
                        v-model:value="element.value" size="small" :status="inputStatus(element)">
                    </n-input-number>
                    <n-input-number v-if="element instanceof VariableElement && element.format == 'hex'"
                        v-model:value="element.value" size="small" :parse="parseHex" :format="formatHex"
                        :status="inputStatus(element)">
                        <template #prefix>0x</template>
                    </n-input-number>
                    <n-input-number v-if="element instanceof ConstantElement || element instanceof AutoElement"
                        v-model:value="element.value" type="text" disabled size="small" />
                    <n-select v-if="element instanceof EnumElement" v-model:value="element.value"
                        :options="enumSelectValues(element)" size="small" :status="inputStatus(element)" />
                    <n-input v-if="element instanceof StringElement" v-model:value="element.value" type="text"
                        size="small" @input="store.updateElements()" :status="inputStatus(element)" />
                    <div v-if="element instanceof BitmapElement">
                        <n-checkbox v-for="k, v in element.bitmapValues" :key="k"
                            @update:checked="updateBitmap(element, k, $event)" :checked="bitMapChecked(element, k)">
                            {{ v }} (0x{{ k.toString(16) }})
                        </n-checkbox>

                        <p>
                            Resulting value: 0x{{ element.value.toString(16) }}
                        </p>
                    </div>

                    <span class="comment">
                        {{ element.comment }}
                    </span>
                </n-gi>
            </template>
        </n-grid>
    </div>
    <div v-else>
        <h2>
            Please select a descriptor on the left.
        </h2>
    </div>
</template>

<style scoped>
.comment {
    font-size: 0.8rem;
    line-height: 1;
    color: #666;
}
</style>
