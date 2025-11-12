import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./FriendsHomePage.css";
import Header from "./Header";
import Footer from "./Footer";

const FriendsHomePage = () => {
  const [activeTab, setActiveTab] = useState("friends");
  const navigate = useNavigate();

  const renderContent = () => {
    switch (activeTab) {
      case "friends":
        return <p> Here’s your friends list (mocked data will come later)</p>;
      case "requests":
        return <p>Here are your pending friend requests</p>;
      case "find":
        return <p> Suggested friends you may know</p>;
      default:
        return null;
    }
  };

  return (
    <>
    <Header title="Friends" />
    <div className="back-btn-row">
    <button className="back-home-btn" onClick={() => navigate("/home")}>
      ← Back
    </button>
    </div>
    <div className="FriendsHomePage">

      <div className="friends-homepage">
        <h1>Welcome to the Friends Page</h1>
        <p>
          <i>Manage your friends, requests, and suggestions below.</i>
        </p>

        <div className="button-container">
          <button
            className={`friends-btn ${activeTab === "friends" ? "active" : ""}`}
            onMouseEnter={() => setActiveTab("friends")}
            onFocus={() => setActiveTab("friends")}
            onClick={() => navigate("/friends/list")}
          >
            View Friends
          </button>
          <button
            className={`friends-btn ${activeTab === "requests" ? "active" : ""}`}
            onMouseEnter={() => setActiveTab("requests")}
            onFocus={() => setActiveTab("requests")}
            onClick={() => navigate("/friends/requests")}
          >
            Friend Requests
          </button>
          <button
            className={`friends-btn ${activeTab === "find" ? "active" : ""}`}
            onMouseEnter={() => setActiveTab("find")}
            onFocus={() => setActiveTab("find")}
            onClick={() => navigate("/friends/find")}
          >
            Find Friends
          </button>
        </div>

        <div className="friends-content">{renderContent()}</div>
      </div>
    </div>
    <Footer/>
    </>
  );
};

export default FriendsHomePage;
