<template>
    <template v-if="isConfigScreen()">
        <AppConfigLocation :sdk="sdk" />

    </template>
    <template v-if="isField()">
        <FieldLocation :sdk="sdk" />
    </template>
</template>
  
<script setup lang="ts">
import { locations, type ConfigAppSDK, type FieldAppSDK } from '@contentful/app-sdk';
import { onMounted, reactive } from 'vue';
import { inject } from 'vue'
import AppConfigLocation from './locations/AppConfigLocation.vue';
import FieldLocation from './locations/FieldLocation.vue';

const $sdk: ConfigAppSDK | FieldAppSDK = inject('$sdk')!;
const sdk = reactive($sdk)

const isConfigScreen = () => {
    return sdk.location.is(locations.LOCATION_APP_CONFIG)
}

const isField = () => {
    return sdk.location.is(locations.LOCATION_ENTRY_FIELD)
}


</script>
  

  