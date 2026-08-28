import User from "../models/User.js";
import Message from "../models/Message.js";

const getUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.id } })
      .select("name email")
      .sort({ name: 1 })
      .lean();

    const withLastMessage = await Promise.all(
      users.map(async (u) => {
        const lastMessage = await Message.findOne({
          $or: [
            { sender: req.user.id, receiver: u._id },
            { sender: u._id, receiver: req.user.id },
          ],
        }).sort({ createdAt: -1 });

        return {
          ...u,
          lastMessage: lastMessage
            ? {
                text: lastMessage.text,
                createdAt: lastMessage.createdAt,
                sender: lastMessage.sender.toString(),
              }
            : null,
        };
      })
    );

    res.json({ users: withLastMessage });
  } catch (error) {
    console.error("Error: ", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("name email");

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Error: ", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export default {
  getUsers,
  getUser,
};