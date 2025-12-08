// InviteFriendsList.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./InviteFriendsList.css";
import FriendThumb from "./FriendThumb";
import Header from "./Header";
import Footer from "./Footer";

const InviteFriendsList = () => {
  const { id: boardId } = useParams();
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInviteCandidates = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          // if somehow this page is hit without a token, kick to login
          navigate("/login");
          return;
        }

        console.log("[InviteFriendsList] fetching invite candidates…");

        const res = await axios.get(
          `http://localhost:4000/api/boardinvites/${boardId}/friends`,
          {
            headers: {
              Authorization: `JWT ${token}`,
            },
          }
        );

        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setFriends(list);
        setError("");
      } catch (err) {
        console.error("Backend request failed:", err);
        setFriends([]);
        setError("Could not load friends you can invite.");
      }
    };

    fetchInviteCandidates();
  }, [boardId, navigate]);

  const handleBack = () => {
    window.history.back();
  };

  // When an invite is successfully sent, remove that user from the list
  const handleInvited = (invitedId) => {
    setFriends((prev) => prev.filter((f) => f.id !== invitedId));
  };

  return (
    <>
      <Header title="Invite Friends" />

      <div className="InviteFriendsList">
        {error && (
          <p
            style={{
              padding: "16px",
              textAlign: "center",
              color: "crimson",
            }}
          >
            {error}
          </p>
        )}

        {friends.length === 0 && !error ? (
          <p
            style={{
              padding: "16px",
              textAlign: "center",
              color: "#666",
            }}
          >
            No friends available to invite — everyone might already be on this
            board or already invited.
          </p>
        ) : (
          <section className="friend-grid">
            {friends.map((friend) => (
              <FriendThumb
                key={friend.id}
                details={friend}
                boardId={boardId}
                onInvite={handleInvited}
              />
            ))}
          </section>
        )}
      </div>

      <Footer />
    </>
  );
};

export default InviteFriendsList;