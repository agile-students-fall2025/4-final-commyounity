import React, { useState } from "react";
import "./MemberThumb.css";

const MemberThumb = (props) => {
  const { details, boardId, canKick, onKicked } = props;

  const [kickMsg, setKickMsg] = useState("");
  const [kickErr, setKickErr] = useState("");
  const [kicking, setKicking] = useState(false);

  const displayName =
    details.name ||
    `${details.first_name || ""} ${details.last_name || ""}`.trim() ||
    details.username ||
    "member";

  const roleLabel = details.isOwner ? "Owner" : "Member";

  const avatarSrc =
    details.avatar || `https://i.pravatar.cc/100?u=${details.id}`;

  // New fields from User schema
  const backgroundText =
    details.background && details.background.trim().length > 0
      ? details.background
      : "No background info yet.";

  const interestsText =
    details.interests && details.interests.trim().length > 0
      ? details.interests
      : "No interests added yet.";

  const handleKick = async () => {
    setKickMsg("");
    setKickErr("");

    const memberId = details.id;
    const token = localStorage.getItem("token");
    if (!token) {
      setKickErr("You’re not logged in. Please log in again.");
      return;
    }

    const confirmed = window.confirm(
      `Remove ${displayName} from this board?`
    );
    if (!confirmed) return;

    try {
      setKicking(true);

      const res = await fetch(
        `http://localhost:4000/api/boards/${boardId}/kick-member`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `jwt ${token}`,
          },
          body: JSON.stringify({ memberId }),
        }
      );

      const data = await res.json();
      if (!res.ok || data.status !== "success") {
        throw new Error(data?.message || data?.error || "Kick failed.");
      }

      if (typeof onKicked === "function") {
        onKicked(memberId);
      }

      const remaining = data?.data?.memberCount;
      if (typeof remaining === "number") {
        setKickMsg(
          `Member removed. ${remaining} member${
            remaining === 1 ? "" : "s"
          } remaining.`
        );
      }
    } catch (err) {
      setKickErr(err.message || "Something went wrong.");
    } finally {
      setKicking(false);
    }
  };

  return (
    <article className="MemberThumb">
      <img alt={displayName} src={avatarSrc} />

      <h2>{displayName}</h2>

      {/* Role label */}
      <div className="role-label">{roleLabel}</div>

      {details.username && (
        <div className="username">@{details.username}</div>
      )}

      {/* New profile fields */}
      <p className="background">
        <strong>Background:</strong> {backgroundText}
      </p>
      <p className="interests">
        <strong>Interests:</strong> {interestsText}
      </p>

      {canKick && !details.isOwner && (
        <button
          className="kick-button"
          onClick={handleKick}
          disabled={kicking}
        >
          {kicking ? "Kicking..." : `Kick ${displayName}`}
        </button>
      )}

      {kickMsg && <p className="success-msg">{kickMsg}</p>}
      {kickErr && <p className="error-msg">{kickErr}</p>}
    </article>
  );
};

export default MemberThumb;