import express from "express";
import userController from "../controller/userController.js";
const { getUsers, getUser } = userController;
import protect from "../middleware/auth.js";

const router = express.Router();

router.get("/users/", protect, getUsers);
router.get("/users/:id", protect, getUser);

export default router;