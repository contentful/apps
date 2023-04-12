<template>
  <div>Hello Home (AppId {{ sdk.ids.app }})</div>
</template>

<script setup lang="ts">
import type { HomeAppSDK } from '@contentful/app-sdk';

defineProps<{ sdk: HomeAppSDK }>();
</script>
