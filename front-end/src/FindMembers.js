import React, { useState } from "react";
import "./FindMembers.css";
import Header from "./Header";

const FindMembers = () => {
  const [query, setQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    alert(`Searching for "${query}" (pretend backend)!`);
  };

  return (
    <><Header title="Find Members" />
    <button className="back-button" onClick={() => window.history.back()}>
        ← Back
      </button>
    <div className="FindMembers">
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
    </>
  );
};

export default FindMembers;