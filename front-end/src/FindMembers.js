import React, { useState } from "react";
import "./FindMembers.css";
import Header from "./Header";
import Footer from "./Footer";

const FindMembers = () => {
  const [query, setQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    alert(`Searching for "${query}" (pretend backend)!`);
  };
  const handleBack = () => {
    window.history.back();
  };
  return (
    <><Header title="Find Members" />
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
        />
        <button type="submit">Search</button>
      </form>
    </div>
    <Footer/>
    </>
  );
};

export default FindMembers;