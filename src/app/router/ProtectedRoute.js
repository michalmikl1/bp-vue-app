import userService from "../services/userService";

export const requireAuth = () => !!userService.getCurrentUser();

export default requireAuth;
