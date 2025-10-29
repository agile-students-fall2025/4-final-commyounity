import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./FriendRequestsPage.css";
import Logo from "./logo.svg";
import mockFriendRequests from "./mockFriendRequests";

const FriendRequestsPage = () => {
  const [requests] = useState(mockFriendRequests);

  const handleAccept = (name) => {
    alert(`Accepted ${name}'s request (pretend)!`);
  };

  const handleDecline = (name) => {
    alert(`Declined ${name}'s request (pretend).`);
  };

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

      {requests.length > 0 ? (
        <section className="request-list">
          {requests.map((request) => {
            const fullName = `${request.first_name} ${request.last_name}`;
            return (
              <article key={request.id} className="request-card">
                <div className="request-user">
                  <img
                    className="request-avatar"
                    src={request.avatar}
                    alt={`${fullName}'s avatar`}
                  />
                  <div>
                    <h2>{fullName}</h2>
                    <div className="request-meta">@{request.username}</div>
                    <div className="request-meta">
                      {request.mutualFriends} mutual friend
                      {request.mutualFriends === 1 ? "" : "s"}
                    </div>
                  </div>
                </div>
                {request.message && (
                  <p className="request-message">{request.message}</p>
                )}
                <div className="request-buttons">
                  <button
                    className="accept"
                    onClick={() => handleAccept(request.first_name)}
                  >
                    Accept
                  </button>
                  <button
                    className="decline"
                    onClick={() => handleDecline(request.first_name)}
                  >
                    Decline
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <div className="request-empty">
          <p>You’re all caught up—no pending requests right now.</p>
        </div>
      )}
    </div>
  );
};

export default FriendRequestsPage;
