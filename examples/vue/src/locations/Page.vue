<template>
  <div>Hello Page (AppId {{ sdk.ids.app }})</div>
</template>

<script setup lang="ts">
import type { PageExtensionSDK } from "@contentful/app-sdk";

defineProps<{ sdk: PageExtensionSDK }>();
</script>
