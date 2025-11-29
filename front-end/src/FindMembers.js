import React, { useState } from "react";
import { useParams } from "react-router-dom";
import "./FindMembers.css";
import Header from "./Header";
import Footer from "./Footer";

const FindMembers = () => {
  const { id: boardId } = useParams();   // ← board ID from URL
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [responseMsg, setResponseMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // ----------------------
  // SEARCH MEMBERS
  // ----------------------
  const handleSearch = async (e) => {
    e.preventDefault();
    setResponseMsg("");
    setErrorMsg("");

    const trimmed = query.trim();
    if (!trimmed) {
      setErrorMsg("Please enter a username.");
      return;
    }

    if (!/^[A-Za-z0-9_]+$/.test(trimmed)) {
      setErrorMsg("Only letters, digits (0–9), and underscores (_) are allowed.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("http://localhost:4000/api/searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });

      const data = await res.json();

      if (!res.ok || data.ok === false) {
        throw new Error(data.error || "Something went wrong.");
      }

      const list = Array.isArray(data.results) ? data.results : [];
      setResults(list);

      setResponseMsg(
        list.length === 0 ? "No users found." : `Found ${list.length} member(s):`
      );
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------
  // SEND INVITE
  // ----------------------
  const handleInvite = async (userId) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `http://localhost:4000/api/boardinvites/${boardId}/invite`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `JWT ${token}`
          },
          body: JSON.stringify({ invitedUserId: userId }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Invite failed.");
      }

      alert("Invite sent!");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleBack = () => window.history.back();

  return (
    <>
      <Header title="Find Members" />
      <button className="back-btn" onClick={handleBack}>
        ← Back
      </button>

      <div className="FindMembers">
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search for members..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            pattern="[A-Za-z0-9_]+"
            title="Only letters, numbers, and underscores (_) are allowed."
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        <div className="search-feedback">
          {responseMsg && <p className="success-msg">{responseMsg}</p>}
          {errorMsg && <p className="error-msg">{errorMsg}</p>}
        </div>

        {results.length > 0 && (
          <ul className="results-list">
            {results.map((u) => (
              <li key={u.id} className="result-item">
                <strong>{u.username}</strong> — {u.name}
                <br />
                {u.email}

                <button
                  className="invite-btn"
                  onClick={() => handleInvite(u.id)}
                >
                  Invite
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Footer />
    </>
  );
};

export default FindMembers;