<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import useAuth from "../../composables/useAuth";

const router = useRouter();
const { register } = useAuth();

const username = ref("");
const password = ref("");
const error = ref("");

const handleRegister = () => {
  try {
    register({ username: username.value, password: password.value });
    router.push("/");
  } catch (err) {
    error.value = err.message;
  }
};
</script>

<template>
  <div class="auth-container">
    <h2>Registrace</h2>
    <form class="auth-form" @submit.prevent="handleRegister">
      <input
        v-model="username"
        type="text"
        placeholder="Uživatelské jméno"
        required
      />
      <input
        v-model="password"
        type="password"
        placeholder="Heslo"
        required
      />
      <button type="submit">Zaregistrovat se</button>
      <p v-if="error" class="auth-error">{{ error }}</p>
    </form>
    <p class="no-account-text">
      Již máte účet? <RouterLink to="/login">Přihlásit se</RouterLink>
    </p>
  </div>
</template>

<style src="../../assets/styles/auth.css"></style>
