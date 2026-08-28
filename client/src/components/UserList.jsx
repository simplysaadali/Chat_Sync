import { useState } from "react";

const initial = (name) => (name || "?").charAt(0).toUpperCase();

export default function UserList({ me, users, activeUser, unread, onlineCount, onlineUsers = [], onSelect, onLogout }) {
  const [search, setSearch] = useState("");

  const shown = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  const isOnline = (id) => onlineUsers.includes(id);

  return (
    <div className="side">
      <div className="side-head">
        <div className="me">
          <div className="avatar">{initial(me.name)}</div>
          <div>
            <div className="name">{me.name}</div>
            <div className="muted small">Logged in</div>
          </div>
        </div>
        <div className="right">
          <span className="online-pill">● Online: {onlineCount}</span>
          <button className="link-btn" onClick={onLogout}>Logout</button>
        </div>
      </div>

      <div className="search">
        <input
          placeholder="Search users"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="list">
        {shown.map((u) => (
          <div
            key={u._id}
            className={"row " + (activeUser?._id === u._id ? "active" : "")}
            onClick={() => onSelect(u)}
          >
            <div className="avatar-wrap">
              <div className="avatar grey">{initial(u.name)}</div>
              {isOnline(u._id) && <span className="online-dot" />}
            </div>
            <div className="info">
              <div className="name">{u.name}</div>
              <div className="muted small preview">
                {u.lastMessage ? u.lastMessage.text : "No messages yet"}
              </div>
            </div>
            {unread[u._id] > 0 && <span className="badge">{unread[u._id]}</span>}
          </div>
        ))}
        {shown.length === 0 && <p className="muted pad">No users found.</p>}
      </div>
    </div>
  );
}