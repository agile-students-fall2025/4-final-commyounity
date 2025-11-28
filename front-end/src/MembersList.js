// MemberList.js
import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import axios from "axios";
import "./MemberList.css";
import MemberThumb from "./MemberThumb";
import Header from "./Header";
import Footer from "./Footer";

const MembersList = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const canKick = !!(state && state.isBoardOwner);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  const initialBoardId = state?.boardId ?? id;
  const [memberCount, setMemberCount] = useState(state?.memberCount);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No JWT token found in localStorage");
          setError("You must be logged in to see members.");
          return;
        }

        const response = await axios.get(
          `http://localhost:4000/api/members/${initialBoardId}`,
          {
            headers: {
              Authorization: `jwt ${token}`,  // keep scheme consistent with your other calls
            },
          }
        );

        console.log("[MEMBERS LIST RESPONSE]", response.data);

        const members = Array.isArray(response.data?.data)
          ? response.data.data
          : [];

        setData(members);
        setError(null);

        // if you want memberCount to come from the backend instead of state
        if (typeof memberCount !== "number") {
          setMemberCount(members.length);
        }
      } catch (err) {
        console.error("Backend request failed:", err);
        setError("Could not load members.");
        setData([]);
      }
    };

    fetchMembers();
  }, [id]); // board id changing should refetch

  const handleBack = () => {
    window.history.back();
  };

  const effectiveMemberCount =
    typeof memberCount === "number" ? memberCount : data.length;

  return (
    <>
      <Header title="Members" />
      <button className="back-btn" onClick={handleBack}>
        ← Back
      </button>

      <div className="MemberList">
        {error ? (
          <p style={{ padding: "20px", textAlign: "center", color: "#888" }}>
            {error}
          </p>
        ) : (
          <section className="member-grid">
            {effectiveMemberCount <= 1 ? (
              <p
                style={{
                  padding: "20px",
                  textAlign: "center",
                  width: "100%",
                  color: "#888",
                  fontStyle: "italic",
                }}
              >
                You are the only member of this board.
              </p>
            ) : data.length === 0 ? (
              <p
                style={{
                  padding: "20px",
                  textAlign: "center",
                  width: "100%",
                  color: "#888",
                  fontStyle: "italic",
                }}
              >
                No members found.
              </p>
            ) : (
              data.map((member) => (
                <MemberThumb
                  key={member.id || member._id}
                  details={member}
                  canKick={canKick}
                  boardId={initialBoardId}
                  memberCount={effectiveMemberCount}
                />
              ))
            )}
          </section>
        )}
      </div>

      <Footer />
    </>
  );
};

export default MembersList;