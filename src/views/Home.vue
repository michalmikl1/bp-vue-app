<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import projectService from "../app/services/project.service";
import Dashboard from "../components/dashboard/Dashboard.vue";
import {
  MAX_PROJECT_DESCRIPTION_LENGTH,
  MAX_PROJECT_NAME_LENGTH,
} from "../shared/constants/input.limits";

const router = useRouter();

const projects = ref([]);
const editingId = ref(null);
const editName = ref("");
const newProjectName = ref("");
const newProjectDescription = ref("");
const error = ref("");
const filterText = ref("");
const deleteModal = ref(null);
const confirmName = ref("");

onMounted(() => {
  projects.value = projectService.getProjects();
});

watch(error, (value, _, onCleanup) => {
  if (!value) return;

  const timer = setTimeout(() => {
    error.value = "";
  }, 5000);

  onCleanup(() => clearTimeout(timer));
});

const projectNameExists = (name, ignoreId = null) =>
  projects.value.some(
    (project) =>
      project.name.toLowerCase() === name.toLowerCase() &&
      project.id !== ignoreId,
  );

const refreshProjects = () => {
  projects.value = projectService.getProjects();
};

const handleAddProject = () => {
  const trimmedName = newProjectName.value.trim();
  const trimmedDescription = newProjectDescription.value.trim();

  if (!trimmedName) {
    error.value = "Název projektu nesmí být prázdný.";
    return;
  }

  if (trimmedName.length > MAX_PROJECT_NAME_LENGTH) {
    error.value = `Název projektu může mít maximálně ${MAX_PROJECT_NAME_LENGTH} znaků.`;
    return;
  }

  if (trimmedDescription.length > MAX_PROJECT_DESCRIPTION_LENGTH) {
    error.value = `Popis projektu může mít maximálně ${MAX_PROJECT_DESCRIPTION_LENGTH} znaků.`;
    return;
  }

  if (projectNameExists(trimmedName)) {
    error.value = "Projekt s tímto názvem již existuje.";
    return;
  }

  try {
    projectService.createProject({
      name: trimmedName,
      description: trimmedDescription,
    });
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Projekt se nepodařilo vytvořit.";
    return;
  }

  refreshProjects();
  newProjectName.value = "";
  newProjectDescription.value = "";
  error.value = "";
};

const handleDelete = () => {
  if (!deleteModal.value) return;

  projectService.deleteProject(deleteModal.value.id);
  refreshProjects();

  deleteModal.value = null;
  confirmName.value = "";
};

const startEditing = (project) => {
  editingId.value = project.id;
  editName.value = project.name;
};

const saveEdit = (id) => {
  const project = projectService.getProjectById(id);
  const trimmedName = editName.value.trim();

  if (!project) {
    return;
  }

  if (!trimmedName) {
    error.value = "Název projektu nesmí být prázdný.";
    return;
  }

  if (trimmedName.length > MAX_PROJECT_NAME_LENGTH) {
    error.value = `Název projektu může mít maximálně ${MAX_PROJECT_NAME_LENGTH} znaků.`;
    return;
  }

  if (projectNameExists(trimmedName, id)) {
    error.value = "Projekt s tímto názvem již existuje.";
    return;
  }

  try {
    projectService.updateProject({
      ...project,
      name: trimmedName,
    });
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Projekt se nepodařilo upravit.";
    return;
  }

  refreshProjects();
  editingId.value = null;
  error.value = "";
};

const truncateDescription = (desc) =>
  desc.length > 30 ? `${desc.slice(0, 30)}...` : desc;

const filteredProjects = computed(() =>
  projects.value.filter((project) =>
    project.name.toLowerCase().includes(filterText.value.toLowerCase()),
  ),
);

const handleCardClick = (projectId) => {
  if (!editingId.value) {
    router.push(`/projects/${projectId}`);
  }
};
</script>

<template>
  <div class="home-container">
    <h1 class="home-title">Vítejte v Task Manageru</h1>
    <hr />

    <h2 class="home-projects-title" id="home-projects-dashboard-title">
      Dashboard
    </h2>
    <Dashboard :projects="projects" />

    <h2 class="home-projects-title">Vaše projekty</h2>

    <div class="project-create-wrap">
      <h3>Vytvořte projekt</h3>
      <form class="project-create-form" @submit.prevent="handleAddProject">
        <input
          v-model="newProjectName"
          type="text"
          placeholder="Název projektu"
          :maxlength="MAX_PROJECT_NAME_LENGTH"
          @input="
            if (error) {
              error = '';
            }
          "
        />
        <textarea
          v-model="newProjectDescription"
          placeholder="Popis projektu (nepovinné)"
          :maxlength="MAX_PROJECT_DESCRIPTION_LENGTH"
        ></textarea>
        <button type="submit">Vytvořit</button>
      </form>
      <p v-if="error" class="project-create-error">{{ error }}</p>
    </div>

    <div v-if="projects.length > 0" class="project-filter">
      <h3>Vyhledejte konkrétní projekt</h3>
      <input
        v-model="filterText"
        type="text"
        placeholder="Filtrovat projekty podle názvu ..."
      />
    </div>

    <p v-if="filteredProjects.length === 0" class="home-empty">
      Žádné projekty nenalezeny.
    </p>
    <div v-else class="home-project-grid">
      <div
        v-for="project in filteredProjects"
        :key="project.id"
        class="project-card"
        :style="{ background: project.gradient }"
        @click="handleCardClick(project.id)"
      >
        <input
          v-if="editingId === project.id"
          v-model="editName"
          class="project-name-input"
          :maxlength="MAX_PROJECT_NAME_LENGTH"
          @blur="saveEdit(project.id)"
          @keydown.enter="saveEdit(project.id)"
          autofocus
        />
        <template v-else>
          <h3 class="project-name">{{ project.name }}</h3>
          <p v-if="project.description" class="project-description">
            {{ truncateDescription(project.description) }}
          </p>
        </template>

        <p class="project-date">
          Vytvořeno: {{ new Date(project.createdAt).toLocaleDateString() }}
        </p>

        <div class="project-btns">
          <button
            class="project-edit-btn"
            @click.stop="startEditing(project)"
          >
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button
            class="project-delete-btn"
            @click.stop="deleteModal = project"
          >
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    </div>

    <div v-if="deleteModal" class="delete-modal-overlay">
      <div class="delete-modal">
        <h3>Smazat projekt</h3>

        <p>
          Opravdu chcete smazat projekt <b>{{ deleteModal.name }}</b
          >?
        </p>

        <p>Pro potvrzení napište název projektu:</p>

        <input
          v-model="confirmName"
          type="text"
          placeholder="Název projektu"
        />

        <div class="delete-modal-buttons">
          <button
            class="cancel-btn"
            @click="
              deleteModal = null;
              confirmName = '';
            "
          >
            Zrušit
          </button>

          <button
            class="confirm-btn"
            :disabled="confirmName !== deleteModal.name"
            @click="handleDelete"
          >
            Smazat
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style src="../assets/styles/home.css"></style>
