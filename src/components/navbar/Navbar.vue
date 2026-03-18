<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import useAuth from "../../composables/useAuth";
import ExportModal from "../ExportModal/ExportModal.vue";

const router = useRouter();
const { currentUser, logout, syncCurrentUser } = useAuth();

const menuOpen = ref(false);
const isExportOpen = ref(false);

onMounted(() => {
  syncCurrentUser();
});

const handleLogout = () => {
  logout();
  router.push("/login");
  menuOpen.value = false;
};

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value;
};
</script>

<template>
  <nav class="navbar">
    <div class="navbar-left">
      <RouterLink to="/" class="navbar-brand">Task Manager</RouterLink>
      <RouterLink to="/upcoming" class="navbar-upcoming-link">
        Nadcházející
      </RouterLink>
    </div>

    <div :class="['navbar-right', { open: menuOpen }]">
      <template v-if="currentUser">
        <span class="navbar-user">{{ currentUser.username }}</span>
        <button class="navbar-export-btn" @click="isExportOpen = true">
          <i class="fa-solid fa-download"></i>
        </button>
        <button class="navbar-logout" @click="handleLogout">Odhlásit se</button>
      </template>
      <RouterLink v-else to="/login" class="navbar-login" @click="menuOpen = false">
        Přihlášení
      </RouterLink>
    </div>

    <button class="navbar-hamburger" @click="toggleMenu">
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
    </button>
  </nav>

  <ExportModal :is-open="isExportOpen" @close="isExportOpen = false" />
</template>

<style src="../../assets/styles/navbar.css"></style>
