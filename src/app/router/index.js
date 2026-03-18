import { createRouter, createWebHistory } from "vue-router";
import Home from "../../views/Home.vue";
import Login from "../../views/users/Login.vue";
import Register from "../../views/users/Register.vue";
import ProjectDetail from "../../views/projects/ProjectDetail.vue";
import Upcoming from "../../views/upcoming/Upcoming.vue";
import requireAuth from "./ProtectedRoute";

const routes = [
  {
    path: "/login",
    component: Login,
  },
  {
    path: "/register",
    component: Register,
  },
  {
    path: "/",
    component: Home,
    meta: { requiresAuth: true },
  },
  {
    path: "/upcoming",
    component: Upcoming,
    meta: { requiresAuth: true },
  },
  {
    path: "/projects/:id",
    component: ProjectDetail,
    meta: { requiresAuth: true },
    props: (route) => ({ id: route.params.id }),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !requireAuth()) {
    return { path: "/login", replace: true };
  }

  return true;
});

export default router;
