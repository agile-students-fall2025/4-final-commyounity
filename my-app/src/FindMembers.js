import React, { useState } from "react";
import "./FindMembers.css";

const FindMembers = () => {
  const [query, setQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    alert(`Searching for "${query}" (pretend backend)!`);
  };

  return (
    <div className="FindMembers">
      <button className="back-button" onClick={() => window.history.back()}>
        ← Back to Board
      </button>

      <h1>Find Members</h1>

      <form className="search-form" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search for members..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>
    </div>
  );
};

export default FindMembers;