import React from "react";
import "./FriendThumb.css";
import axios from "axios";

const FriendThumb = ({ details, boardId, variant = "card", onUnfriend, onInvite }) => {
  const imgSrc =
    details.avatar || `https://i.pravatar.cc/100?u=${details.id}`;
  const isOnline = Boolean(details.online);
  const statusText = isOnline ? "Online" : "Offline";

  const handleUnfriendClick = () => {
    const confirmed = window.confirm("Are you sure?");
    if (confirmed) {
      console.log(`Unfriend confirmed for ${details.first_name}`);
      if (typeof onUnfriend === "function") {
        onUnfriend(details.id);
      }
    }
  };

  const handleInviteClick = async () => {
    try {
      console.log(`[FRONTEND] Inviting ${details.first_name}...`);
      const response = await axios.post(
        `http://localhost:3000/api/boards/${boardId}/invite`, 
        { friendId: details.id }
      );

      console.log("Backend response:", response.data);
      alert(`Invite sent to ${details.first_name}! (Backend received it)`);
      
      if (typeof onInvite === "function") onInvite(details.id);
    } catch (err) {
      console.error("Invite failed:", err);
      alert("Invite failed — check backend console/logs.");
    }
  };


  return (
    <article
      className={`FriendThumb${variant === "list" ? " FriendThumb--list" : ""}`}
    >
      <div className="FriendThumb-main">
        <img
          alt={`${details.first_name} ${details.last_name}`}
          src={imgSrc}
        />
        <div className="FriendThumb-info">
          <h2>
            {details.first_name} {details.last_name}
          </h2>
          <div className="username">@{details.username}</div>
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
                alert(`Viewing ${details.first_name}'s profile (pretend)!`)
              }
            >
              View Profile
            </button>
            <button
              className="unfriend-button"
              onClick={handleUnfriendClick}
            >
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
