<template>
  <div>Hello Dialog (AppId {{ sdk.ids.app }})</div>
</template>

<script setup lang="ts">
import type { DialogAppSDK } from '@contentful/app-sdk';

defineProps<{ sdk: DialogAppSDK }>();
</script>
