<!-- eslint-disable vue/multi-word-component-names -- retain existing single-word component name, no rename in scope -->
<script setup lang="ts">
import { ref } from 'vue'
import { NFlex, NPageHeader, NGrid, NGi, NButton, useMessage } from 'naive-ui'
import { Github } from '@vicons/fa'
import { ArrowDownload16Filled, ArrowUpload16Filled } from '@vicons/fluent'
import { Icon } from '@vicons/utils';
import { useDescriptorStore } from '@/stores/descriptor'

const emit = defineEmits(['toggleTheme', 'download', 'imported'])

const store = useDescriptorStore()
const message = useMessage()
const fileInput = ref<HTMLInputElement | null>(null)

function triggerImport() {
    fileInput.value?.click()
}

function onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]

    if (file) {
        const reader = new FileReader()
        reader.onload = () => {
            try {
                store.loadJSON(reader.result as string)
                message.success(`Imported descriptors from ${file.name}`)
                emit('imported')
            } catch (error) {
                message.error(`Could not import ${file.name}: ${(error as Error).message}`)
            }
        }
        reader.onerror = () => message.error(`Could not read ${file.name}`)
        reader.readAsText(file)
    }

    // Reset so selecting the same file again still fires a change event.
    input.value = ''
}
</script>

<template>
    <n-page-header>
        <n-grid :cols="2">
            <n-gi>
                <h1>USB Descryptor</h1>
            </n-gi>
            <n-gi>
                <n-flex justify="end">
                    <n-button @click="triggerImport">
                        <Icon size="24">
                            <ArrowUpload16Filled />
                        </Icon>
                    </n-button>
                    <input ref="fileInput" type="file" accept=".json,application/json" style="display: none"
                        @change="onFileSelected">

                    <n-button @click="emit('download')">
                        <Icon size="24">
                            <ArrowDownload16Filled />
                        </Icon>
                    </n-button>

                    <!-- <n-button @click="$emit('toggleTheme')">
                        <Icon size="24">
                            <DarkTheme20Regular />
                        </Icon>
                    </n-button> -->

                    <n-button tag="a" href="https://github.com/usb-descryptor/usb-descryptor" target="_new">
                        <Icon size="24">
                            <Github />
                        </Icon>
                    </n-button>
                </n-flex>
            </n-gi>
        </n-grid>
    </n-page-header>
</template>

<style scoped>
h1 {
    font-weight: 600;
}

.n-button {
    margin-left: 0.5rem;
    margin-top: 0.5rem;
}
</style>