<template>
  <div class="container my-8 mx-auto">
    <div class="flex flex-col">
      <div class="space-y-1 mx-4 sm:mx-6">
        <h3 class="text-lg leading-6 font-medium text-gray-100">
          About
        </h3>
        <p class="text-sm text-gray-200">
          Shows information about your Youtube Desktop Instance
        </p>
      </div>
      <div class="h-px my-4 bg-gray-500 rounded"></div>
      <div class="flex flex-row mx-4 sm:mx-6">
        <div class="flex flex-col flex-1">
          <span class="font-semibold">Version</span>
          <span class="text-green-500 text-sm">{{ appVersion }}</span>
        </div>
        <button
          class="btn btn-ghost"
          v-if="downloaded && available"
          @click="runUpdate"
        >
          Install Update
        </button>
        <button
          class="btn btn-ghost"
          v-else-if="available && !downloaded"
          disabled
        >
          Downloading...
        </button>
        <button
          class="btn btn-ghost"
          v-else-if="!available && !downloaded"
          @click="checkUpdate"
        >
          Check for Update
        </button>
      </div>
      <div class="h-px my-4 bg-gray-500 rounded"></div>
      <div class="px-5 flex flex-col gap-4">
        <settings-checkbox configKey="app.beta">
          Include Pre Releases / Beta
        </settings-checkbox>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import SettingsCheckbox from "@/components/SettingsCheckbox.vue";
import { defineComponent, ref } from "vue";

export default defineComponent({
  components: { SettingsCheckbox },
  data() {
    return {
      downloaded: false,
      available: false,
    };
  },
  computed: {
    appVersion(): string {
      return (window as any).api.version;
    },
  },
  methods: {
    runUpdate() {
      (window as any).api.installUpdate();
    },
    checkUpdate() {
      (window as any).api.checkUpdate();
    },
  },
  created() {
    (window as any).ipcRenderer.on(
      "app.updateAvailable",
      () => (this.available = true)
    );
    (window as any).ipcRenderer.on(
      "app.updateDownloaded",
      () => (this.downloaded = true)
    );
  },
});
</script>

<style></style>
