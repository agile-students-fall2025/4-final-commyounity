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

  // Prefer boardId from state, fall back to URL param
  const initialBoardId = state?.boardId ?? id;

  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No JWT token found in localStorage");
          setError("You must be logged in to see members.");
          setData([]);
          return;
        }

        const response = await axios.get(
          `http://178.128.70.142:4000/api/members/${initialBoardId}`,
          {
            headers: {
              Authorization: `jwt ${token}`, // keep same scheme as other calls
            },
          }
        );

        console.log("[MEMBERS LIST RESPONSE]", response.data);

        const members = Array.isArray(response.data?.data)
          ? response.data.data
          : [];

        setData(members);
        setError(null);
      } catch (err) {
        console.error("Backend request failed:", err);
        setError("Could not load members.");
        setData([]);
      }
    };

    if (initialBoardId) {
      fetchMembers();
    }
  }, [initialBoardId]);

  const handleBack = () => {
    window.history.back();
  };

  // If there is exactly one member and it's the current user, show the special message
  const isOnlySelf =
    data.length === 1 && data[0]?.isSelf === true;

  return (
    <>
      <Header title="Members" />
      <div className="MemberList">
        {error ? (
          <p style={{ padding: "20px", textAlign: "center", color: "#888" }}>
            {error}
          </p>
        ) : (
          <section className="member-grid">
            {data.length === 0 ? (
              <p
                style={{
                  padding: "20px",
                  textAlign: "center",
                  width: "100%",
                  color: "#888",
                  fontStyle: "italic",
                }}
              >
                No members found for this board.
              </p>
            ) : isOnlySelf ? (
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
            ) : (
              data.map((member) => (
                <MemberThumb
                  key={member.id || member._id}
                  details={member}
                  canKick={canKick}
                  boardId={initialBoardId}
                  memberCount={data.length}
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