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
  const [unread, setUnread] = useState({}); // { userId: count }
  const [messages, setMessages] = useState([]);
  const navigate = useNavigate();

  // Load the contact list.
 useEffect(() => {
  api.get("/chat/users")
    .then((res) => setUsers(res.data.users))   // <-- was res.data
    .catch(() => {});
}, []);

  // Make sure the socket is connected on this page.
  useEffect(() => {
    if (!socket.connected) socket.connect();
  }, []);

  //bONE-TIME: fill in unread badges on load
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

    const handleChatMessage = (message) => {
      const isOpenThread =
        activeUser &&
        (message.sender === activeUser._id || message.receiver === activeUser._id) &&
        (message.sender === user._id || message.receiver === user._id);

      if (isOpenThread) {
        setMessages((prev) => [...prev, message]);

        // If the other person sent this while we already have the thread
        // open, mark it read right away so the badge doesn't flicker on.
        if (message.sender !== user._id) {
          socket.emit("chat:read", message.sender);
        }
      }
      // Badge counts are handled entirely by chat:unread:update below —
      // don't bump them here or you'll double-count.
    };

    const handleUnreadUpdate = ({ userId: fromId, count }) => {
      setUnread((prev) => ({ ...prev, [fromId]: count }));
    };

    socket.on("online:count", handleOnlineCount);
    socket.on("chat:message", handleChatMessage);
    socket.on("chat:unread:update", handleUnreadUpdate);

    return () => {
      // IMPORTANT: remove listeners here or messages will appear twice.
      socket.off("online:count", handleOnlineCount);
      socket.off("chat:message", handleChatMessage);
      socket.off("chat:unread:update", handleUnreadUpdate);
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
    // Do NOT add the message to state here — it comes back via "chat:message".
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