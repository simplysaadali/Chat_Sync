import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api.js";
import socket from "../socket";
import UserList from "../components/UserList.jsx";
import ChatThread from "../components/ChatThread.jsx";

export default function Chat({ user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [unread, setUnread] = useState({});
  const [messages, setMessages] = useState([]);
  const navigate = useNavigate();

  // Load the contact list.
  useEffect(() => {
    api.get("/chat/users")
      .then((res) => setUsers(res.data.users))
      .catch(() => {});
  }, []);

  // Make sure the socket is connected on this page.
  useEffect(() => {
    if (!socket.connected) socket.connect();
  }, []);

  // ONE-TIME: fill in unread badges on load
  useEffect(() => {
    socket.emit("chat:unread", (list) => {
      const initial = {};
      (list || []).forEach(({ userId: fromId, count }) => {
        initial[fromId] = count;
      });
      setUnread(initial);
    });
  }, []);

  // SOCKET LISTENERS
  useEffect(() => {
    const handleOnlineCount = (count) => setOnlineCount(count);
    const handleOnlineUsers = (ids) => setOnlineUsers(ids);

    const handleChatMessage = (message) => {
      const otherId = message.sender === user._id ? message.receiver : message.sender;

      // keep the sidebar preview in sync
      setUsers((prev) =>
        prev.map((u) =>
          u._id === otherId
            ? { ...u, lastMessage: { text: message.text, createdAt: message.createdAt, sender: message.sender } }
            : u
        )
      );

      const isOpenThread =
        activeUser &&
        (message.sender === activeUser._id || message.receiver === activeUser._id) &&
        (message.sender === user._id || message.receiver === user._id);

      if (isOpenThread) {
        setMessages((prev) => [...prev, message]);

        if (message.sender !== user._id) {
          socket.emit("chat:read", message.sender);
        }
      }
    };

    const handleUnreadUpdate = ({ userId: fromId, count }) => {
      setUnread((prev) => ({ ...prev, [fromId]: count }));
    };

    const handleReadAck = ({ by }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.sender === user._id && m.receiver === by ? { ...m, read: true } : m
        )
      );
    };

    socket.on("online:count", handleOnlineCount);
    socket.on("online:users", handleOnlineUsers);
    socket.on("chat:message", handleChatMessage);
    socket.on("chat:unread:update", handleUnreadUpdate);
    socket.on("chat:read:ack", handleReadAck);

    return () => {
      socket.off("online:count", handleOnlineCount);
      socket.off("online:users", handleOnlineUsers);
      socket.off("chat:message", handleChatMessage);
      socket.off("chat:unread:update", handleUnreadUpdate);
      socket.off("chat:read:ack", handleReadAck);
    };
  }, [activeUser, user]);

  // ---------- OPEN A CHAT ----------
  const openChat = (other) => {
    setActiveUser(other);
    setMessages([]);

    socket.emit("chat:history", other._id, (history) => {
      setMessages(history || []);
    });

    socket.emit("chat:read", other._id);

    setUnread((prev) => ({ ...prev, [other._id]: 0 }));
  };

  // ---------- SEND A MESSAGE ----------
  const sendMessage = (text) => {
    if (!text.trim() || !activeUser) return;

    socket.emit(
      "chat:send",
      { receiver: activeUser._id, text: text.trim() },
      (res) => {
        if (res?.error) {
          console.error("Failed to send message:", res.error);
        }
      }
    );
  };

  const logout = async () => {
    await api.post("/auth/logout");
    socket.disconnect();
    onLogout();
    navigate("/login");
  };

  return (
    <div className="app">
      <UserList
        me={user}
        users={users}
        activeUser={activeUser}
        unread={unread}
        onlineCount={onlineCount}
        onlineUsers={onlineUsers}
        onSelect={openChat}
        onLogout={logout}
      />
      {activeUser ? (
        <ChatThread
          me={user}
          other={activeUser}
          messages={messages}
          onSend={sendMessage}
        />
      ) : (
        <div className="main">
          <div className="empty">
            <div className="empty-icon">💬</div>
            <h3>WhatsApp Style Chat</h3>
            <p>Select a user from the left to start chatting.</p>
            <span className="online-pill">Online users: {onlineCount}</span>
          </div>
        </div>
      )}
    </div>
  );
}