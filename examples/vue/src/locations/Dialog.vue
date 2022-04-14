<template>
  <div>Hello Dialog (AppId {{ sdk.ids.app }})</div>
</template>

<script setup lang="ts">
import type { DialogExtensionSDK } from "@contentful/app-sdk";

defineProps<{ sdk: DialogExtensionSDK }>();
</script>
