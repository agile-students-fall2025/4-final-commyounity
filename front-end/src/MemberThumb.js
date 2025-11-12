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
    const memberCount = props.memberCount;

    // --- CHANGED: nicer message if memberCount is still loading
    if (memberCount === undefined) {
      setKickErr("memberCount isn’t available yet. Please wait a moment and try again.");
      return;
    }

    try {
      setKicking(true);
      const res = await fetch(`http://localhost:4000/api/boards/${boardId}/kick-member`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, memberCount }),
      });

      const data = await res.json();
      console.log("Kick response:", data);

      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Kick failed.");
      }

      const next = data?.data?.memberCount;
      const prev = data?.meta?.memberCountPrev;
      if (typeof next === "number" && typeof prev === "number") {
        setKickMsg(`Kick recorded. memberCount would go from ${prev} → ${next}.`);
      } else {
        setKickMsg(data?.message || "Kick recorded.");
      }
    } catch (err) {
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
        <button className="kick-button" onClick={handleKick} disabled={kicking}>
          {kicking ? "Kicking..." : `Kick ${props.details.first_name}`}
        </button>
      )}

      {kickMsg && <p className="success-msg">{kickMsg}</p>}
      {kickErr && <p className="error-msg">{kickErr}</p>}
    </article>
  );
};

export default MemberThumb;