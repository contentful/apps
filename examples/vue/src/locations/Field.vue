<template>
  <div>Hello Field (AppId {{ sdk.ids.app }})</div>
</template>

<script setup lang="ts">
import type { FieldExtensionSDK } from "@contentful/app-sdk";

defineProps<{ sdk: FieldExtensionSDK }>();
</script>
