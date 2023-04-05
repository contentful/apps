<template>
  <div>Hello Sidebar (AppId {{ sdk.ids.app }})</div>
</template>

<script setup lang="ts">
import type { SidebarAppSDK } from '@contentful/app-sdk';

defineProps<{ sdk: SidebarAppSDK }>();
</script>
