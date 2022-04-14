<template>
  <div>Hello Sidebar (AppId {{ sdk.ids.app }})</div>
</template>

<script setup lang="ts">
import type { SidebarExtensionSDK } from "@contentful/app-sdk";

defineProps<{ sdk: SidebarExtensionSDK }>();
</script>
