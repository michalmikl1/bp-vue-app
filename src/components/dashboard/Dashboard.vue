<script setup>
import { computed } from "vue";
import taskService from "../../app/services/task.service";
import { TaskStatus } from "../../shared/constants/task.constants";

const props = defineProps({
  projects: {
    type: Array,
    required: true,
  },
});

const tasks = taskService.getTasks();

const totalProjects = computed(() => props.projects.length);
const totalTasks = computed(() => tasks.length);
const completedTasks = computed(() => tasks.filter((t) => t.completed).length);
const activeTasks = computed(() => totalTasks.value - completedTasks.value);

const tasksByStatus = computed(() => ({
  TODO: tasks.filter((t) => t.status === TaskStatus.TODO).length,
  IN_PROGRESS: tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length,
  REVIEW: tasks.filter((t) => t.status === TaskStatus.REVIEW).length,
}));

const tasksByPriority = computed(() => ({
  LOW: tasks.filter((t) => t.priority === "LOW").length,
  MEDIUM: tasks.filter((t) => t.priority === "MEDIUM").length,
  HIGH: tasks.filter((t) => t.priority === "HIGH").length,
}));

const tasksDueSoon = computed(
  () =>
    tasks.filter((t) => {
      if (!t.dueDate) return false;
      const now = new Date();
      const due = new Date(t.dueDate);
      const diff = (due - now) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 1;
    }).length,
);
</script>

<template>
  <div class="db-container">
    <div class="db-stats-grid">
      <div class="db-stat-box">
        <h3>Projekty celkem</h3>
        <p>{{ totalProjects }}</p>
      </div>
      <div class="db-stat-box">
        <h3>&Uacute;koly celkem</h3>
        <p>{{ totalTasks }}</p>
      </div>
      <div class="db-stat-box">
        <h3>&Uacute;koly podle stavu</h3>
        <p>Zpracovat: {{ tasksByStatus.TODO }}</p>
        <p>Prob&iacute;h&aacute;: {{ tasksByStatus.IN_PROGRESS }}</p>
        <p>Ke kontrole: {{ tasksByStatus.REVIEW }}</p>
      </div>
      <div class="db-stat-box">
        <h3>Stav &uacute;kolů</h3>
        <p>Aktivn&iacute;: {{ activeTasks }}</p>
        <p>Splněn&eacute;: {{ completedTasks }}</p>
      </div>
      <div class="db-stat-box">
        <h3>&Uacute;koly podle priority</h3>
        <p>N&iacute;zk&aacute;: {{ tasksByPriority.LOW }}</p>
        <p>Středn&iacute;: {{ tasksByPriority.MEDIUM }}</p>
        <p>Vysok&aacute;: {{ tasksByPriority.HIGH }}</p>
      </div>
      <div class="db-stat-box">
        <h3>&Uacute;koly s term&iacute;nem do 1 dne</h3>
        <p>{{ tasksDueSoon }}</p>
      </div>
    </div>
  </div>
</template>

<style src="../../assets/styles/dashboard.css"></style>
