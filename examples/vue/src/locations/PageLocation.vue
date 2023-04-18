<template>
  <div>Hello Page (AppId {{ sdk.ids.app }})</div>
</template>

<script setup lang="ts">
import type { PageAppSDK } from '@contentful/app-sdk';

defineProps<{ sdk: PageAppSDK }>();
</script>
