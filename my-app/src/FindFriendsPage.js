import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./FindFriendsPage.css";
import Logo from "./logo.svg";

const FindFriendsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="FindFriendsPage">
      <header className="findfriends-header">
        <div className="findfriends-logo">
          <img src={Logo} alt="App logo" />
        </div>
        <Link to="/friends" className="back-btn">
          ← Back to Friends Home
        </Link>
      </header>

      <h1>Find Friends</h1>
      <p>
        <i>Search for new connections and send an invite once you find a match.</i>
      </p>

      <div className="findfriends-search">
        <input
          type="search"
          placeholder="Search by name or username"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <button type="button" disabled>
          Search
        </button>
      </div>

      <section className="findfriends-demo-card" aria-live="polite">
        <p>Search results will appear here as the feature evolves.</p>
      </section>
    </div>
  );
};

export default FindFriendsPage;
