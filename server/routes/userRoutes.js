import express from "express";
import userController from "../controller/userController.js";
const { getUsers, getUser } = userController;
import protect from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, getUsers);
router.get("/:id", protect, getUser);

export default router;