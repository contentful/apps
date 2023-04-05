<template>
  <div>Hello Entry Editor (AppId {{ sdk.ids.app }})</div>
</template>

<script setup lang="ts">
import type { EditorAppSDK } from '@contentful/app-sdk';

defineProps<{ sdk: EditorAppSDK }>();
</script>
