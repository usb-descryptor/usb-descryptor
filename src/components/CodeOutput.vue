<script setup lang="ts">
import { ref } from 'vue';
import { NSelect, NFlex, NButton, useMessage } from 'naive-ui';
import { useDescriptorStore } from '@/stores/descriptor';
import { Copy16Regular } from '@vicons/fluent';
import { Icon } from '@vicons/utils';
import { generateC, generateRust } from '../usb/codegen';

import hljs from 'highlight.js';

const store = useDescriptorStore();
const message = useMessage();

const languages = [
    {
        label: 'C',
        value: 'c'
    },
    {
        label: 'Rust',
        value: 'rust'
    }
];

const language = ref(languages[0].value);

function code(): string {
    switch (language.value) {
        case 'rust':
            return generateRust(store.descriptors);
        case 'c':
        default:
            return generateC(store.descriptors);
    }
}

function highlightedCode() {
    return hljs.highlight(code(), { language: language.value }).value;
}

function copyToClipboard() {
    navigator.clipboard.writeText(code());
    message.info("Copied to clipboard. Happy pasting!");
}
</script>

<template>
    <div class="code-output">
        <n-flex>
            <div>
                <span>Language</span>
            </div>
            <div>
                <n-select v-model:value="language" :options="languages" size="small" style="min-width: 5rem" />
            </div>
            <div>
                <n-button @click="copyToClipboard" size="small">
                    <Icon size="16" style="margin-right: 0.3rem;">
                        <Copy16Regular />
                    </Icon>
                    Copy to clipboard
                </n-button>
            </div>
        </n-flex>

        <div class="code">
            <pre v-html="highlightedCode()" />
        </div>
    </div>
</template>

<style scoped>
.code-output {
    margin-top: 1rem;
}

.code {
    font-family: 'Courier New', Courier, monospace !important;
    font-size: 0.8rem;
    line-height: 1.5;
    display: inline-block;
    white-space: pre-wrap;
    scroll-behavior: smooth;
    overflow-x: auto;
}
</style>
