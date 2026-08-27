// import { protect } from '...'; 
const bcrypt = require("bcryptjs");
// const crypto = require("crypto");
const User = require("../models/User");
const { signToken, cookieOptions, publicUser } = require("../utils/helper");

const router = express.Router();

// register route
router.post("/register", async (req, res) => {
    try {
      const { name, email, password } = req.body;

      if(await User.findOne({ email })){
        return res.status(400).json({
            message: "Email already registered"
        });
      }

      const hash = await bcrypt.hash(password, 10);

      const user = await User.create({
        name,
        email,
        password: hash,
      });

    res.cookie("token", signToken(user), cookieOptions)
    .status(201)
    .json({
        user: publicUser(user),
    });

    } catch (error) {
        res.status(500).json({
            message: error.message,
        });    
    }
});

// login route
router.post("/login", async (req, res) => {
    try {
        const { password } = req.body;
        const email = String(req.body.email ?? "").trim().toLowerCase();

        const user = await User.findOne({ email }).select("+password");

        const ok = user && (await bycrypt.comapre(password, user.password))

        if(!ok){
            return res.status(400).json({
            message: "Invalid Credentials"
        });
    }
    res.cookie("token", signToken(user), cookieOptions)
    .status(200).json({
        user: publicUser(user),
    });
    } catch (error) {
        console.error("Error: ", error);

        res.status(500).json({
            message: "Server Error!",
        });
    }
});

//me route
const getMe = async (req, res) => {
    try {
        const user = await User.findOne({ email });

        if(!user){
            return res.status(401).json({
                message: "No User",
            });
        }

        res.status(200).json({
            user: publicUser(user),
        });
    } catch (error) {
        console.error("Error: ", error);
        res.status(500).json({
            message: "Server Error",
        });
    }
}

//logout route
router.post("/logout", async (req, res) => {
    try {
        res.clearCookie("token", cookieOptions);
        res.json({ message: "Logged Out" });
    } catch (error) {
        console.error("Error: ", error);
        res.status(500).json({
            message: "Server Error",
        });
    }
});

module.exports = {
    register,
    login,
    logout,
    getMe,
};