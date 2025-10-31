import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./FriendRequestsPage.css";
import Logo from "./logo.svg";
import mockFriends from "./mockFriends";
import mockFriendRequestsFallback from "./mockFriendRequestsFallback";
import { FRIENDS_STORAGE_KEY } from "./storageKeys";
import Header from "./Header";
import Footer from "./Footer";

const FriendRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchRequests = async () => {
      const applyRequests = (incoming) => {
        if (!isMounted) return;
        const normalized = Array.isArray(incoming) ? incoming : [incoming];
        setRequests(normalized);
        setError(null);
      };

      try {
        const response = await fetch(
          "https://my.api.mockaroo.com/friends.json?key=dc8ece40&count=6",
          {
            headers: {
              "X-API-Key": "dc8ece40",
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Mockaroo responded with ${response.status}`);
        }

        const data = await response.json();
        applyRequests(data);
      } catch (err) {
        if (!isMounted) return;
        console.warn("Unable to load friend requests from Mockaroo.", err);
        /**
         * We fall back to a tiny, human-readable set of mock requests so that:
         * 1) Stakeholders still see how the screen behaves when the API quota is exhausted.
         * 2) It's painfully obvious this is temporary—the UI message below calls it out.
         * Remove this fallback once the real back-end is wired up.
         */
        setRequests(mockFriendRequestsFallback);
        setError(
          "Showing backup sample requests because the live mock API hit its daily limit."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchRequests();

    return () => {
      isMounted = false;
    };
  }, []);

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
    <><Header title="Friend Requests" />
    <Link to="/friends" className="back-btn">
          ← Back
        </Link>
    <div className="FriendRequestsPage">
      <p>
        <i>Review and manage people who want to connect with you.</i>
      </p>

      {feedback && (
        <div className={`request-feedback ${feedback.type}`} role="status">
          {feedback.message}
        </div>
      )}

      {loading ? (
        <div className="request-loading">Loading your friend requests…</div>
      ) : (
        <>
          {error && (
            <div className="request-error" role="alert">
              {error}
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
              <h2>No pending requests</h2>
              <p>
                You’re all caught up for now. Check back later or keep building
                your commYOUnity.
              </p>
              <Link to="/friends/find" className="request-empty-cta">
                Find Friends
              </Link>
            </div>
          )}
        </>
      )}
    </div>
    <Footer />
    </>
  );
};

export default FriendRequestsPage;
