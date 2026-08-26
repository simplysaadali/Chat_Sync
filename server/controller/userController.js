import User from "../models/User";

const getUsers = async (req, res) => {
    try {
        const users = await User.find({
            _id: {
                $ne: req.user.id,
            }
        }).select("name email")
        .sort({ name: 1 });

        res.json({
            users
        });

    } catch (error) {
        console.error("Error: ", error);
        res.status(500).json({
            message: "Server Error",
        });
    }
};

const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        .select("name email");

        if(!user){
            return res.status(404).json({
                message: "User not found!",
            });
        }

        res.json({
            user
        });

    } catch (error) {
        console.error("Error: ", error);
        res.status(500).json({
            message: "Server Error",
        });
    }
};

module.exports = {
    getUsers,
    getUser,
}