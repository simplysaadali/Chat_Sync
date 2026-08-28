import { Server } from "socket.io";
import jwt from "jsonwebtoken";

import Message from "./models/Message.js";

// userId -> number of open sockets for that user
const onlineUsers = new Map();

function getOnlineCount() {
  return onlineUsers.size;
}

function addUser(userId) {
  onlineUsers.set(userId, (onlineUsers.get(userId) || 0) + 1);
}

function removeUser(userId) {
  const count = (onlineUsers.get(userId) || 1) - 1;
  if (count <= 0) onlineUsers.delete(userId);
  else onlineUsers.set(userId, count);
}

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  // ---- DONE FOR YOU: JWT check during the handshake ----
  io.use((socket, next) => {
    try {
      const raw = socket.handshake.headers.cookie || "";
      const token = cookie.parse(raw).token;
      if (!token) return next(new Error("No token"));

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = { id: payload.id };
      next();
    } catch (err) {
      next(new Error("Not authorised"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user.id;

    socket.join(userId);

    addUser(userId);
    console.log("Connected:", userId, "| online:", getOnlineCount());

// 1: online:count
    io.emit("online:count", getOnlineCount());

// 2: chat:history
    socket.on("chat:history", async (withUserId, ack) => {
        try {
            const message = await Message.find({
                $or: [
                    { sender: userId, receiver: withUserId },
                    { sender: withUserId, receiver: userId }
                ],
            }).sort ({ createdAt: 1 });

            ack(message);
        } catch (error) {
            console.error("chat:history error:", err.message);
            ack([]);
        }
    });

// 3: chat:send
    socket.on("chat:send", async ({ receiver, text }, ack) => {
      try {
        if (!text || !text.trim()) {
          if (ack) ack({ error: "Message is empty" });
          return;
        }

        const message = await Message.create({
          sender: userId,
          receiver,
          text: text.trim(),
          read: false,
        });

        io.to(userId).to(receiver).emit("chat:message", message);

        const count = await Message.countDocuments({
          sender: userId,
          receiver,
          read: false,
        });
        io.to(receiver).emit("chat:unread:update", { userId, count });

        if (ack) ack({ success: true, message });
      } catch (err) {
        console.error("chat:send error:", err.message);
        if (ack) ack({ error: "Could not send message" });
      }
    });

// 4: chat:unread
    socket.on("chat:unread", async (ack) => {
      try {
        const counts = await Message.aggregate([
          { $match: { receiver: new mongoose.Types.ObjectId(userId), read: false } },
          { $group: { _id: "$from", count: { $sum: 1 } } },
        ]);

        const result = counts.map((c) => ({ userId: c._id.toString(), count: c.count }));
        ack(result);
      } catch (err) {
        console.error("chat:unread error:", err.message);
        ack([]);
      }
    });

//  5: chat:read
    socket.on("chat:read", async (fromUserId) => {
      try {
        await Message.updateMany(
          { sender: fromUserId, receiver: userId, read: false },
          { $set: { read: true } }
        );

        // 6: chat:unread:update
        io.to(userId).emit("chat:unread:update", { userId: fromUserId, count: 0 });

        // Sender ko batao ke uske messages padh liye gaye — ticks blue karne ke liye.
        io.to(fromUserId).emit("chat:read:ack", { by: userId });
      } catch (err) {
        console.error("chat:read error:", err.message);
      }
    });

    // Bonus: chat:typing
    socket.on("chat:typing", ({ receiver }) => {
      io.to(receiver).emit("chat:typing", { from: userId });
    });

    socket.on("disconnect", () => {
      removeUser(userId);
      console.log("Disconnected:", userId, "| online:", getOnlineCount());
      io.emit("online:count", getOnlineCount());
    });
  });

  return io;
}

export default initSocket;
