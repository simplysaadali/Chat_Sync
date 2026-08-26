import express from "express";
import { getUsers, getUser } from "../controller/userController";
import protect from "../middleware/auth";

const router = express.Router();

router.get("/", protect, getUsers);
router.get("/:id", protect, getUser);

export default router;