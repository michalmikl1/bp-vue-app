import { readonly, ref } from "vue";
import userService from "../app/services/userService";

const currentUser = ref(userService.getCurrentUser());

const syncCurrentUser = () => {
  currentUser.value = userService.getCurrentUser();
  return currentUser.value;
};

const login = (credentials) => {
  const user = userService.login(credentials);
  syncCurrentUser();
  return user;
};

const register = (credentials) => {
  const user = userService.register(credentials);
  syncCurrentUser();
  return user;
};

const logout = () => {
  userService.logout();
  syncCurrentUser();
};

export default function useAuth() {
  return {
    currentUser: readonly(currentUser),
    syncCurrentUser,
    login,
    register,
    logout,
  };
}
