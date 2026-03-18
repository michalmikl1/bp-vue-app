<script setup>
import { ref, watch } from "vue";
import { exportData } from "../../shared/utils/export/exportData";

defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(["close"]);

const includeProjects = ref(true);
const includeTasks = ref(true);
const includeUser = ref(false);
const format = ref("json");
const warning = ref("");

watch(warning, (value, _, onCleanup) => {
  if (!value) return;

  const timer = setTimeout(() => {
    warning.value = "";
  }, 5000);

  onCleanup(() => clearTimeout(timer));
});

const handleExport = () => {
  if (!includeProjects.value && !includeTasks.value && !includeUser.value) {
    warning.value = "Musíte zvolit alespoň jednu možnost pro export.";
    return;
  }

  exportData({
    includeProjects: includeProjects.value,
    includeTasks: includeTasks.value,
    includeUser: includeUser.value,
    format: format.value,
  });

  emit("close");
};
</script>

<template>
  <div v-if="isOpen" class="export-overlay" @click="emit('close')">
    <div class="export-modal" @click.stop>
      <h2>Data pro export</h2>

      <div v-if="warning" class="export-warning">{{ warning }}</div>

      <div class="export-section">
        <h3>Co exportovat</h3>

        <label class="export-option">
          <input v-model="includeProjects" type="checkbox" />
          Projekty
        </label>

        <label class="export-option">
          <input v-model="includeTasks" type="checkbox" />
          Úkoly
        </label>

        <label class="export-option">
          <input v-model="includeUser" type="checkbox" />
          Uživatelské informace
        </label>
      </div>

      <div class="export-section">
        <h3>Formát</h3>

        <label class="export-option">
          <input v-model="format" type="radio" value="json" />
          JSON
        </label>

        <label class="export-option">
          <input v-model="format" type="radio" value="csv" />
          CSV
        </label>

        <label class="export-option">
          <input v-model="format" type="radio" value="md" />
          Markdown
        </label>
      </div>

      <div class="export-buttons">
        <button class="export-btn export-btn-secondary" @click="emit('close')">
          Zrušit
        </button>

        <button class="export-btn export-btn-primary" @click="handleExport">
          Exportovat
        </button>
      </div>
    </div>
  </div>
</template>

<style src="../../assets/styles/exportmodal.css"></style>
