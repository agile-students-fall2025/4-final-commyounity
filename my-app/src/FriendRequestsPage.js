import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./FriendRequestsPage.css";
import Logo from "./logo.svg";
import mockFriendRequests from "./mockFriendRequests";
import mockFriends from "./mockFriends";
import { FRIENDS_STORAGE_KEY } from "./storageKeys";

const FriendRequestsPage = () => {
  const [requests, setRequests] = useState(() => mockFriendRequests);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (!feedback) {
      return undefined;
    }

    const timer = window.setTimeout(() => setFeedback(null), 3500);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const updateStoredFriends = (updater) => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const stored = window.localStorage.getItem(FRIENDS_STORAGE_KEY);
      let parsed = mockFriends;

      if (stored) {
        const existing = JSON.parse(stored);
        if (Array.isArray(existing)) {
          parsed = existing;
        }
      } else {
        window.localStorage.setItem(
          FRIENDS_STORAGE_KEY,
          JSON.stringify(mockFriends)
        );
      }

      const next = updater(parsed);
      window.localStorage.setItem(FRIENDS_STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.warn("Unable to update stored friends.", error);
    }
  };

  const handleAccept = (request) => {
    const fullName = `${request.first_name} ${request.last_name}`;

    setRequests((prev) => prev.filter((item) => item.id !== request.id));

    updateStoredFriends((current) => {
      if (current.some((friend) => friend.id === request.id)) {
        return current;
      }

      return [
        ...current,
        {
          id: request.id,
          first_name: request.first_name,
          last_name: request.last_name,
          username: request.username,
          avatar: request.avatar,
          online: true,
        },
      ];
    });

    setFeedback({
      type: "success",
      message: `${fullName} was added to your friends list.`,
    });
  };

  const handleDecline = (request) => {
    const fullName = `${request.first_name} ${request.last_name}`;

    setRequests((prev) => prev.filter((item) => item.id !== request.id));

    setFeedback({
      type: "info",
      message: `Declined ${fullName}'s friend request.`,
    });
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

      {feedback && (
        <div className={`request-feedback ${feedback.type}`} role="status">
          {feedback.message}
        </div>
      )}

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
                    onClick={() => handleAccept(request)}
                  >
                    Accept
                  </button>
                  <button
                    className="decline"
                    onClick={() => handleDecline(request)}
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
