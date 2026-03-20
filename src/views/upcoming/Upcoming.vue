<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import taskService, {
  TASKS_UPDATED_EVENT,
} from "../../app/services/task.service";
import projectService from "../../app/services/project.service";

const upcomingTasks = ref({});
let refreshIntervalId = null;
const handleTasksUpdated = () => refreshTasks();
const handleStorage = () => refreshTasks();

const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDate = (dateString) => {
  const options = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  };
  return new Date(dateString).toLocaleDateString("cs-CZ", options);
};

const refreshTasks = () => {
  const projects = projectService.getProjects();
  const tasks = taskService.getTasks();

  const daysAhead = 90;
  const today = new Date();
  const upcoming = {};

  for (let i = 0; i <= daysAhead; i += 1) {
    const day = new Date();
    day.setDate(today.getDate() + i);

    const key = formatLocalDate(day);

    const tasksForDay = tasks
      .filter((task) => task.dueDate === key)
      .map((task) => {
        const project = projects.find((p) => p.id === task.projectId);
        return {
          ...task,
          projectName: project ? project.name : "Bez projektu",
          projectGradient: project ? project.gradient : null,
          projectId: project ? project.id : null,
        };
      });

    tasksForDay.sort((a, b) => {
      if (a.projectName < b.projectName) return -1;
      if (a.projectName > b.projectName) return 1;
      return 0;
    });

    upcoming[key] = tasksForDay;
  }

  upcomingTasks.value = upcoming;
};

onMounted(() => {
  refreshTasks();
  refreshIntervalId = setInterval(refreshTasks, 30000);
  window.addEventListener(TASKS_UPDATED_EVENT, handleTasksUpdated);
  window.addEventListener("storage", handleStorage);
});

onUnmounted(() => {
  if (refreshIntervalId) {
    clearInterval(refreshIntervalId);
  }
  window.removeEventListener(TASKS_UPDATED_EVENT, handleTasksUpdated);
  window.removeEventListener("storage", handleStorage);
});
</script>

<template>
  <div class="upcoming-container">
    <h2>Nadcházející úkoly</h2>

    <div
      v-for="date in Object.keys(upcomingTasks)"
      :key="date"
      :class="['day-block', { 'has-tasks': upcomingTasks[date].length > 0 }]"
    >
      <h3>{{ formatDate(date) }}</h3>

      <ul v-if="upcomingTasks[date].length > 0">
        <li v-for="task in upcomingTasks[date]" :key="task.id">
          <RouterLink
            v-if="task.projectId"
            :to="`/projects/${task.projectId}`"
            :class="['task-link', { 'task-completed': task.completed }]"
            :title="`[${task.projectName}] ${task.title}`"
          >
            <span class="task-project">[{{ task.projectName }}]</span>
            <span class="task-title">{{ task.title }}</span>
          </RouterLink>
          <a
            v-else
            href="#"
            :class="['task-link', { 'task-completed': task.completed }]"
            :title="`[${task.projectName}] ${task.title}`"
          >
            <span class="task-project">[{{ task.projectName }}]</span>
            <span class="task-title">{{ task.title }}</span>
          </a>
        </li>
      </ul>
      <p v-else class="no-tasks">Žádné úkoly</p>
    </div>
  </div>
</template>

<style src="../../assets/styles/upcoming.css"></style>
