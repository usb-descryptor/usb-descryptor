<script setup lang="ts">
import { NFlex, NPageHeader, NGrid, NGi, NButton, NPopover } from 'naive-ui'
import { Github } from '@vicons/fa'
import { DarkTheme20Regular, ArrowUpload16Filled, ArrowDownload16Filled } from '@vicons/fluent'
import { Icon } from '@vicons/utils';
</script>

<template>
    <n-page-header>
        <n-grid :cols="2">
            <n-gi>
                <h1>USB Descryptor</h1>
            </n-gi>
            <n-gi>
                <n-flex justify="end">
                    <!-- <n-popover :overlap="true" :show-arrow="false" placement="right" trigger="click">
                        <template #trigger>
                            <n-button>
                                <Icon size="24">
                                    <ArrowUpload16Filled />
                                </Icon>
                                </input>
                            </n-button>
                        </template>
<div>
    <input type="file" @change="$emit('upload')">
</div>
</n-popover> -->

                    <n-button @click="$emit('download')">
                        <Icon size="24">
                            <ArrowDownload16Filled />
                        </Icon>
                    </n-button>

                    <!-- <n-button @click="$emit('toggleTheme')">
                        <Icon size="24">
                            <DarkTheme20Regular />
                        </Icon>
                    </n-button> -->

                    <n-button tag="a" href="https://github.com/usb-descryptor/" target="_new">
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