<template>
  <div>Hello Config (AppId {{ sdk.ids.app }})</div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import type { AppExtensionSDK } from "@contentful/app-sdk";

export interface AppInstallationParameters {}

const props = defineProps<{ sdk: AppExtensionSDK }>();

let parameters = {};

const onConfigure = async () => {
  // This method will be called when a user clicks on "Install"
  // or "Save" in the configuration screen.
  // for more details see https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/#register-an-app-configuration-hook

  // Get current the state of EditorInterface and other entities
  // related to this app installation
  const currentState = await props.sdk.app.getCurrentState();

  return {
    // Parameters to be persisted as the app configuration.
    parameters,
    // In case you don't want to submit any update to app
    // locations, you can just pass the currentState as is
    targetState: currentState,
  };
};

props.sdk.app.onConfigure(() => onConfigure());

onMounted(async () => {
  const params: AppInstallationParameters | null =
    await props.sdk.app.getParameters();
  parameters = params || parameters;
  await props.sdk.app.setReady();
});
</script>
