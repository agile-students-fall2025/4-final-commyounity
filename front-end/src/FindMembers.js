import React, { useState } from "react";
import "./FindMembers.css";
import Header from "./Header";
import Footer from "./Footer";

const FindMembers = () => {
  const [query, setQuery] = useState("");
  const [responseMsg, setResponseMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

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
      console.log("Response from backend:", data);
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || "Something went wrong.");
      }
      setResponseMsg(data.message || "Search request received!");
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    window.history.back();
  };

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
            aria-invalid={Boolean(errorMsg)}
            aria-describedby="search-feedback"
          />
          <button type="submit" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </button>
        </form>
        <div id="search-feedback" aria-live="polite">
          {responseMsg && <p className="success-msg">{responseMsg}</p>}
          {errorMsg && <p className="error-msg">{errorMsg}</p>}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default FindMembers;