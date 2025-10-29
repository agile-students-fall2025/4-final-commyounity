import React from "react";
import { Link } from "react-router-dom";
import "./FriendRequestsPage.css";
import Logo from "./logo.svg";

const FriendRequestsPage = () => {
  return (
    <div className="FriendRequestsPage">
      <header className="friendrequests-header">
        <div className="friendrequests-logo">
          <img src={Logo} alt="App logo" />
        </div>
        <Link to="/friends" className="back-btn">
          ← Back to Friends Home
        </Link>
      </header>

      <h1>Friend Requests</h1>
      <p>
        <i>Review and manage people who want to connect with you.</i>
      </p>
    </div>
  );
};

export default FriendRequestsPage;
