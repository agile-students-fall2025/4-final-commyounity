// FriendThumb.js
import React from "react";
import "./FriendThumb.css";
import axios from "axios";

const FriendThumb = ({
  details,
  boardId,
  variant = "card",
  onUnfriend,
  onInvite,
}) => {
  // Backend now returns: { id, username, name, email }
  const displayName = details.name || details.username || "Unknown User";
  const secondaryLabel =
    details.email || (details.username ? `@${details.username}` : "");
  const imgSrc =
    details.avatar ||
    `https://i.pravatar.cc/100?u=${details.id || details.email || details.username}`;

  const isOnline = Boolean(details.online); // if you ever add real online status
  const statusText = isOnline ? "Online" : "Offline";

  const handleUnfriendClick = () => {
    const confirmed = window.confirm("Are you sure?");
    if (confirmed) {
      console.log(`Unfriend confirmed for ${displayName}`);
      if (typeof onUnfriend === "function") {
        onUnfriend(details.id);
      }
    }
  };

  const handleInviteClick = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You must be logged in to send invites.");
        return;
      }

      console.log(`[FRONTEND] Inviting ${displayName} to board ${boardId}…`);

      const response = await axios.post(
        `http://localhost:4000/api/boards/${boardId}/invite`,
        {
          invitedUserId: details.id, // 🔑 this matches the backend route
        },
        {
          headers: {
            Authorization: `jwt ${token}`, // 🔑 required for passport-jwt
          },
        }
      );

      console.log("Backend response:", response.data);
      alert(`Invite sent to ${displayName}!`);

      if (typeof onInvite === "function") {
        onInvite(details.id);
      }
    } catch (err) {
      console.error("Invite failed:", err);

      const msg =
        err.response?.data?.message ||
        err.message ||
        "Invite failed — check backend logs.";
      alert(msg);
    }
  };

  return (
    <article
      className={`FriendThumb${
        variant === "list" ? " FriendThumb--list" : ""
      }`}
    >
      <div className="FriendThumb-main">
        <img alt={displayName} src={imgSrc} />
        <div className="FriendThumb-info">
          <h2>{displayName}</h2>
          {secondaryLabel && (
            <div className="username">{secondaryLabel}</div>
          )}
          <div className={`status ${isOnline ? "online" : "offline"}`}>
            <span className="status-indicator" />
            {statusText}
          </div>
        </div>
      </div>

      <div className="FriendThumb-actions">
        {variant === "list" ? (
          <>
            <button
              className="view-profile-button"
              onClick={() =>
                alert(`Viewing ${displayName}'s profile (pretend)!`)
              }
            >
              View Profile
            </button>
            <button className="unfriend-button" onClick={handleUnfriendClick}>
              Unfriend
            </button>
          </>
        ) : (
          <button className="invite-button" onClick={handleInviteClick}>
            Invite Member
          </button>
        )}
      </div>
    </article>
  );
};

export default FriendThumb;