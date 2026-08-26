import express from "express"
import protect from "../middleware/auth"

const {
    register,
    login,
    logout,
    getMe,
} = require("../controller/authController");

const router = express.Router();

router.post("/register", register)
router.post("/login", login)
router.post("/logout", logout)

router.get("/me", protect, getMe);

export default router;
