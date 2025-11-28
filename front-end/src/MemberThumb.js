import React, { useState } from "react";
import "./MemberThumb.css";

const MemberThumb = (props) => {
  const [kickMsg, setKickMsg] = useState("");
  const [kickErr, setKickErr] = useState("");
  const [kicking, setKicking] = useState(false);

  const handleKick = async () => {
    setKickMsg("");
    setKickErr("");

    const boardId = props.boardId;
    const memberId = props.details.id;

    // Get JWT from localStorage (same as other protected calls)
    const token = localStorage.getItem("token");
    if (!token) {
      setKickErr("You’re not logged in. Please log in again.");
      return;
    }

    const confirmed = window.confirm(
      `Remove ${props.details.first_name} from this board?`
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
      console.log("Kick response:", data);

      if (!res.ok || data.status !== "success") {
        throw new Error(data?.message || data?.error || "Kick failed.");
      }

      const remaining = data?.data?.memberCount;
      if (typeof remaining === "number") {
        setKickMsg(
          `Member removed. There are now ${remaining} member${
            remaining === 1 ? "" : "s"
          } on this board.`
        );
      } else {
        setKickMsg(data?.message || "Member removed from the board.");
      }

      // Let parent list know so it can remove this card from UI
      if (typeof props.onKicked === "function") {
        props.onKicked(memberId);
      }
    } catch (err) {
      console.error("Kick error:", err);
      setKickErr(err.message || "Something went wrong.");
    } finally {
      setKicking(false);
    }
  };

  return (
    <article className="MemberThumb">
      <img
        alt={`${props.details.first_name} ${props.details.last_name}`}
        src={props.details.avatar}
      />
      <h2>
        {props.details.first_name} {props.details.last_name}
      </h2>
      <div className="username">@{props.details.username}</div>
      <div className="country">From: {props.details.country}</div>
      <p className="description">Interests: {props.details.description}</p>

      {props.canKick && (
        <button
          className="kick-button"
          onClick={handleKick}
          disabled={kicking}
        >
          {kicking ? "Kicking..." : `Kick ${props.details.first_name}`}
        </button>
      )}

      {kickMsg && <p className="success-msg">{kickMsg}</p>}
      {kickErr && <p className="error-msg">{kickErr}</p>}
    </article>
  );
};

export default MemberThumb;