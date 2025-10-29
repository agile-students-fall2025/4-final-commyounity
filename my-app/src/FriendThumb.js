import React from "react";
import "./FriendThumb.css";

const FriendThumb = ({ details, variant = "card" }) => {
  const imgSrc = `https://i.pravatar.cc/100?u=${details.id}`;
  const isOnline = Boolean(details.online);
  const statusText = isOnline ? "Online" : "Offline";

  const handleUnfriendClick = () => {
    const confirmed = window.confirm("Are you sure?");
    if (confirmed) {
      console.log(`Unfriend confirmed for ${details.first_name}`);
      // Placeholder: actual unfriend logic will be added later
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
          <button
            className="invite-button"
            onClick={() =>
              alert(`You just invited ${details.first_name} (pretend)!`)
            }
          >
            Invite Member
          </button>
        )}
      </div>
    </article>
  );
};

export default FriendThumb;
