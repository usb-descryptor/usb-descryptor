<script setup lang="ts">
import { ref } from 'vue';
import { NConfigProvider, NMessageProvider, NSplit, darkTheme, lightTheme } from 'naive-ui';
import Header from './components/Header.vue'
import TreeView from './components/TreeView.vue';
import Details from './components/Details.vue';
import CodeOutput from './components/CodeOutput.vue';

import { useDescriptorStore } from '@/stores/descriptor'
const store = useDescriptorStore();

let currentDescriptor = ref(null);

const currentTheme = ref('dark');

function selected(descriptor: any) {
    currentDescriptor.value = descriptor;
}

function upload() {
    console.log('upload');
}

function download() {
    console.log('download');

    const filename = `descryptor.json`;
    const text = store.dumpJSON();

    var element = document.createElement('a');
    element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

function toggleTheme() {
    currentTheme.value = (currentTheme.value == 'dark') ? 'light' : 'dark';
}
</script>

<template>
    <n-config-provider :theme="currentTheme === 'light' ? lightTheme : darkTheme">
        <n-message-provider>
            <Header @toggleTheme="toggleTheme" @upload="upload" @download="download" />
            <div id="main">
                <n-split direction="horizontal" style="min-height: 200px" :max="0.75" :min="0.25">
                    <template #1>
                        <TreeView @selected="selected" />
                    </template>
                    <template #2>
                        <Details :descriptor="currentDescriptor" id="details" />
                    </template>
                </n-split>
                <CodeOutput />
            </div>
        </n-message-provider>
    </n-config-provider>
</template>

<style scoped>
#app {
    width: 100%;
}

#main {
    margin-top: 1rem;
}

#details {
    margin-left: 1rem;
}
</style>
