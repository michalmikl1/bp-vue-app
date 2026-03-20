<script setup>
import { computed, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import projectService from "../../app/services/project.service";
import taskService from "../../app/services/task.service";
import {
  TaskPriority,
  TaskStatus,
} from "../../shared/constants/task.constants";
import {
  MAX_PROJECT_DESCRIPTION_LENGTH,
  MAX_TASK_DESCRIPTION_LENGTH,
  MAX_TASK_TITLE_LENGTH,
} from "../../shared/constants/input.limits";

const props = defineProps({
  id: {
    type: [String, Number],
    required: true,
  },
});

const router = useRouter();

const createDefaultTask = () => ({
  title: "",
  description: "",
  status: TaskStatus.TODO,
  priority: TaskPriority.MEDIUM,
  dueDate: "",
});

const projectId = computed(() => Number(props.id));

const project = ref(null);
const tasks = ref([]);
const formVisible = ref(false);
const newTask = reactive(createDefaultTask());

const editingTaskId = ref(null);
const editingTask = reactive({});
const editingDesc = ref(false);
const descValue = ref("");
const error = ref("");

const statusFilter = ref("");
const priorityFilter = ref("");
const dueSoonOnly = ref(false);

const loadProject = () => {
  const found = projectService.getProjectById(projectId.value);
  project.value = found || null;
  tasks.value = taskService.getTasksByProjectId(projectId.value);
  descValue.value = found?.description || "";
};

watch(() => props.id, loadProject, { immediate: true });

const refreshTasks = () => {
  tasks.value = taskService.getTasksByProjectId(projectId.value);
};

const resetNewTask = () => {
  Object.assign(newTask, createDefaultTask());
};

const resetEditingTask = () => {
  Object.keys(editingTask).forEach((key) => {
    delete editingTask[key];
  });
};

const handleCreateTask = () => {
  const title = newTask.title.trim();
  const description = newTask.description.trim();

  if (!title) {
    error.value = "Název úkolu nesmí být prázdný.";
    return;
  }

  if (title.length > MAX_TASK_TITLE_LENGTH) {
    error.value = `Název úkolu může mít maximálně ${MAX_TASK_TITLE_LENGTH} znaků.`;
    return;
  }

  if (description.length > MAX_TASK_DESCRIPTION_LENGTH) {
    error.value = `Popis úkolu může mít maximálně ${MAX_TASK_DESCRIPTION_LENGTH} znaků.`;
    return;
  }

  try {
    taskService.createTask({ ...newTask, projectId: projectId.value });
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Úkol se nepodařilo vytvořit.";
    return;
  }

  refreshTasks();
  formVisible.value = false;
  resetNewTask();
  error.value = "";
};

const handleDelete = (taskId) => {
  const task = tasks.value.find((item) => item.id === taskId);
  if (!task) return;

  const confirmDelete = window.confirm(
    `Opravdu chcete smazat úkol "${task.title}"? Tuto akci nelze vrátit.`,
  );

  if (confirmDelete) {
    taskService.deleteTask(taskId);
    refreshTasks();
  }
};

const startEditingTask = (task) => {
  editingTaskId.value = task.id;
  resetEditingTask();
  Object.assign(editingTask, task);
};

const saveTaskEdit = () => {
  const title = (editingTask.title || "").trim();
  const description = (editingTask.description || "").trim();

  if (!title) {
    error.value = "Název úkolu nesmí být prázdný.";
    return;
  }

  if (title.length > MAX_TASK_TITLE_LENGTH) {
    error.value = `Název úkolu může mít maximálně ${MAX_TASK_TITLE_LENGTH} znaků.`;
    return;
  }

  if (description.length > MAX_TASK_DESCRIPTION_LENGTH) {
    error.value = `Popis úkolu může mít maximálně ${MAX_TASK_DESCRIPTION_LENGTH} znaků.`;
    return;
  }

  try {
    taskService.updateTask({ ...editingTask, title, description });
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Úkol se nepodařilo upravit.";
    return;
  }

  refreshTasks();
  editingTaskId.value = null;
  resetEditingTask();
  error.value = "";
};

const statusCz = {
  [TaskStatus.TODO]: "Zpracovat",
  [TaskStatus.IN_PROGRESS]: "Probíhá",
  [TaskStatus.DONE]: "Hotovo",
};

const priorityCz = {
  [TaskPriority.LOW]: "Nízká",
  [TaskPriority.MEDIUM]: "Střední",
  [TaskPriority.HIGH]: "Vysoká",
};

const stats = computed(() => ({
  total: tasks.value.length,
  todo: tasks.value.filter((t) => t.status === TaskStatus.TODO).length,
  inProgress: tasks.value.filter((t) => t.status === TaskStatus.IN_PROGRESS).length,
  done: tasks.value.filter((t) => t.status === TaskStatus.DONE).length,
  high: tasks.value.filter((t) => t.priority === TaskPriority.HIGH).length,
}));

const filteredTasks = computed(() =>
  tasks.value.filter((task) => {
    if (statusFilter.value && task.status !== statusFilter.value) return false;
    if (priorityFilter.value && task.priority !== priorityFilter.value) return false;
    if (dueSoonOnly.value) {
      if (!task.dueDate) return false;
      const now = new Date();
      const due = new Date(task.dueDate);
      const diff = (due - now) / (1000 * 60 * 60 * 24);
      if (diff < 0 || diff > 1) return false;
    }
    return true;
  }),
);

const saveProjectDesc = () => {
  const description = descValue.value.trim();

  if (description.length > MAX_PROJECT_DESCRIPTION_LENGTH) {
    error.value = `Popis projektu může mít maximálně ${MAX_PROJECT_DESCRIPTION_LENGTH} znaků.`;
    return;
  }

  try {
    projectService.updateProject({ ...project.value, description });
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : "Popis projektu se nepodařilo uložit.";
    return;
  }

  project.value = { ...project.value, description };
  editingDesc.value = false;
  error.value = "";
};

const cancelProjectDesc = () => {
  descValue.value = project.value?.description || "";
  editingDesc.value = false;
};

const isTaskDueSoon = (task) =>
  task.dueDate
    ? (new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24) <= 1
    : false;
</script>

<template>
  <div v-if="!project" class="project-detail-container">
    <h2>Projekt nebyl nalezen</h2>
    <button class="back-btn" @click="router.push('/')">Zpět na projekty</button>
  </div>

  <div v-else class="project-detail-container">
    <button class="back-btn" @click="router.go(-1)">← Zpět</button>

    <div class="project-header" :style="{ background: project.gradient }">
      <h1 class="project-header-title">{{ project.name }}</h1>

      <div v-if="editingDesc" class="project-desc-edit-wrap">
        <textarea
          v-model="descValue"
          class="project-desc-input"
          :maxlength="MAX_PROJECT_DESCRIPTION_LENGTH"
        ></textarea>
        <div class="project-desc-buttons">
          <button class="task-save-btn" @click="saveProjectDesc">Uložit</button>
          <button class="task-delete-button" @click="cancelProjectDesc">
            Zrušit
          </button>
        </div>
      </div>
      <p v-else class="project-header-desc">
        {{ project.description || "Bez popisu" }}
        <i
          class="fa-solid fa-pen-to-square edit-desc-icon"
          title="Upravit popis"
          @click="editingDesc = true"
        ></i>
      </p>

      <span class="project-header-date">
        Datum vytvoření: {{ new Date(project.createdAt).toLocaleDateString() }}
      </span>
    </div>

    <p v-if="error" class="project-create-error">{{ error }}</p>

    <div class="stats-grid">
      <div class="stat-box">
        <h3>{{ stats.total }}</h3>
        <p>Celkem</p>
      </div>
      <div class="stat-box">
        <h3>{{ stats.todo }}</h3>
        <p>TODO</p>
      </div>
      <div class="stat-box">
        <h3>{{ stats.inProgress }}</h3>
        <p>Probíhá</p>
      </div>
      <div class="stat-box">
        <h3>{{ stats.done }}</h3>
        <p>Hotovo</p>
      </div>
      <div class="stat-box">
        <h3>{{ stats.high }}</h3>
        <p>Vysoká priorita</p>
      </div>
    </div>

    <div class="tasks-section">
      <div class="tasks-header">
        <h2 class="tasks-title">Úkoly</h2>
        <button class="task-button" @click="formVisible = !formVisible">
          {{ formVisible ? "Zavřít" : "Přidat úkol" }}
        </button>
      </div>

      <form v-if="formVisible" class="task-form" @submit.prevent="handleCreateTask">
        <input
          v-model="newTask.title"
          type="text"
          placeholder="Název úkolu"
          :maxlength="MAX_TASK_TITLE_LENGTH"
          required
        />
        <textarea
          v-model="newTask.description"
          placeholder="Popis"
          :maxlength="MAX_TASK_DESCRIPTION_LENGTH"
        ></textarea>
        <select v-model="newTask.status">
          <option v-for="status in Object.values(TaskStatus)" :key="status" :value="status">
            {{ statusCz[status] }}
          </option>
        </select>
        <select v-model="newTask.priority">
          <option
            v-for="priority in Object.values(TaskPriority)"
            :key="priority"
            :value="priority"
          >
            {{ priorityCz[priority] }}
          </option>
        </select>
        <input v-model="newTask.dueDate" type="date" required />
        <button class="task-save-btn" type="submit">Uložit</button>
      </form>

      <div class="task-filters">
        <select v-model="statusFilter">
          <option value="">Všechny stavy</option>
          <option v-for="status in Object.values(TaskStatus)" :key="status" :value="status">
            {{ statusCz[status] }}
          </option>
        </select>
        <select v-model="priorityFilter">
          <option value="">Všechny priority</option>
          <option
            v-for="priority in Object.values(TaskPriority)"
            :key="priority"
            :value="priority"
          >
            {{ priorityCz[priority] }}
          </option>
        </select>
        <label class="due-soon-label">
          <input v-model="dueSoonOnly" type="checkbox" />
          Úkoly do 1 dne
        </label>
      </div>

      <div class="task-grid">
        <div
          v-for="task in filteredTasks"
          :key="task.id"
          :class="['task-card', { 'task-due-soon': isTaskDueSoon(task) }]"
        >
          <div class="task-inner-card">
            <template v-if="editingTaskId === task.id">
              <input
                v-model="editingTask.title"
                class="task-card-title-input"
                :maxlength="MAX_TASK_TITLE_LENGTH"
              />
              <textarea
                v-model="editingTask.description"
                class="task-card-desc-input"
                :maxlength="MAX_TASK_DESCRIPTION_LENGTH"
              ></textarea>
              <select v-model="editingTask.status">
                <option
                  v-for="status in Object.values(TaskStatus)"
                  :key="status"
                  :value="status"
                >
                  {{ statusCz[status] }}
                </option>
              </select>
              <select v-model="editingTask.priority">
                <option
                  v-for="priority in Object.values(TaskPriority)"
                  :key="priority"
                  :value="priority"
                >
                  {{ priorityCz[priority] }}
                </option>
              </select>
              <input v-model="editingTask.dueDate" type="date" />
            </template>
            <template v-else>
              <h3 class="task-card-title">{{ task.title }}</h3>
              <p class="task-card-desc">{{ task.description }}</p>
              <p class="task-card-status">Status: {{ statusCz[task.status] }}</p>
              <p class="task-card-priority">
                Priorita: {{ priorityCz[task.priority] }}
              </p>
              <p v-if="task.dueDate" class="task-card-enddate">
                Termín dokončení:
                {{ new Date(task.dueDate).toLocaleDateString() }}
              </p>
            </template>
          </div>

          <div class="task-card-buttons">
            <button
              v-if="editingTaskId === task.id"
              class="task-save-btn"
              @click="saveTaskEdit"
            >
              Uložit změny
            </button>
            <template v-else>
              <button
                class="task-button task-edit-btn"
                @click="startEditingTask(task)"
              >
                Upravit
              </button>
              <button
                class="task-delete-button"
                @click="handleDelete(task.id)"
              >
                Smazat
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style src="../../assets/styles/projectDetail.css"></style>
