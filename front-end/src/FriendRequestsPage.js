import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./FriendRequestsPage.css";
import { FRIENDS_STORAGE_KEY } from "./storageKeys";
import Header from "./Header";
import Footer from "./Footer";

const BACKEND_BASE =
  (process.env.REACT_APP_BACKEND_URL &&
    process.env.REACT_APP_BACKEND_URL.replace(/\/$/, "")) ||
  "http://localhost:4000";
const FRIEND_REQUESTS_ENDPOINT = `${BACKEND_BASE}/api/friend-requests`;

const REQUESTS_CACHE_KEY = "friend-requests";

const normalizeRequest = (request, index) => {
  const fallbackId = `request-${Date.now()}-${index}`;
  const id = request.id ?? fallbackId;
  const firstName = request.first_name ?? request.firstName ?? "Friend";
  const lastName = request.last_name ?? request.lastName ?? "";
  const username =
    request.username ??
    request.handle ??
    `user-${typeof id === "string" ? id : fallbackId}`;

  return {
    id,
    first_name: firstName,
    last_name: lastName,
    username,
    avatar:
      request.avatar ??
      request.profilePhotoURL ??
      `https://picsum.photos/seed/${username}/200/200`,
    message: request.message,
    mutualFriends:
      typeof request.mutualFriends === "number" ? request.mutualFriends : undefined,
  };
};

const loadCachedRequests = () => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const cached = window.localStorage.getItem(REQUESTS_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        return parsed.map((item, index) => normalizeRequest(item, index));
      }
    }
  } catch (storageError) {
    console.warn("Unable to read cached friend requests.", storageError);
  }

  return [];
};

const persistRequests = (requests) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      REQUESTS_CACHE_KEY,
      JSON.stringify(requests)
    );
  } catch (storageError) {
    console.warn("Unable to cache friend requests.", storageError);
  }
};

const FriendRequestsPage = () => {
  const [requests, setRequests] = useState(loadCachedRequests);
  const [loading, setLoading] = useState(requests.length === 0);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const hadCachedRequestsRef = useRef(requests.length > 0);

  const setRequestsAndPersist = (updater) => {
    setRequests((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      persistRequests(next);
      return next;
    });
  };

  useEffect(() => {
    let isMounted = true;

    const fetchRequests = async () => {
      if (!hadCachedRequestsRef.current) {
        setLoading(true);
      }

      try {
        const response = await fetch(FRIEND_REQUESTS_ENDPOINT);

        if (!response.ok) {
          throw new Error(`Server responded with status ${response.status}`);
        }

        const payload = await response.json();
        const normalized = Array.isArray(payload?.data)
          ? payload.data.map(normalizeRequest)
          : [];

        if (!isMounted) {
          return;
        }

        setRequestsAndPersist(normalized);
        hadCachedRequestsRef.current = normalized.length > 0;
        setError(null);
      } catch (fetchError) {
        if (!isMounted) {
          return;
        }

        console.warn("Unable to load friend requests from the API.", fetchError);
        setError(
          "We couldn't load your friend requests right now. Showing your most recent saved list."
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
      let parsed = [];

      if (stored) {
        const existing = JSON.parse(stored);
        if (Array.isArray(existing)) {
          parsed = existing;
        }
      }

      const next = updater(parsed);
      window.localStorage.setItem(FRIENDS_STORAGE_KEY, JSON.stringify(next));
    } catch (storageError) {
      console.warn("Unable to update stored friends.", storageError);
    }
  };

  const handleAccept = async (request) => {
    const fullName = `${request.first_name} ${request.last_name}`;

    try {
      const response = await fetch(
        `${FRIEND_REQUESTS_ENDPOINT}/${encodeURIComponent(request.id)}/accept`,
        { method: "POST" }
      );

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      const payload = await response.json();

      setRequestsAndPersist((prev) =>
        prev.filter((item) => item.id !== request.id)
      );

      if (payload?.friend) {
        updateStoredFriends((current) => {
          if (current.some((friend) => friend.id === payload.friend.id)) {
            return current;
          }
          return [...current, payload.friend];
        });
      }

      setFeedback({
        type: "success",
        message: `${fullName} was added to your friends list.`,
      });
    } catch (actionError) {
      console.warn("Unable to accept friend request.", actionError);
      setFeedback({
        type: "error",
        message: "We couldn’t accept the request. Please try again shortly.",
      });
    }
  };

  const handleDecline = async (request) => {
    const fullName = `${request.first_name} ${request.last_name}`;

    try {
      const response = await fetch(
        `${FRIEND_REQUESTS_ENDPOINT}/${encodeURIComponent(request.id)}/decline`,
        { method: "POST" }
      );

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      await response.json();

      setRequestsAndPersist((prev) =>
        prev.filter((item) => item.id !== request.id)
      );

      setFeedback({
        type: "info",
        message: `Declined ${fullName}'s friend request.`,
      });
    } catch (actionError) {
      console.warn("Unable to decline friend request.", actionError);
      setFeedback({
        type: "error",
        message: "We couldn’t decline the request. Please try again shortly.",
      });
    }
  };

  return (
    <>
      <Header title="Friend Requests" />
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
                          <div className="request-meta">
                            @{request.username}
                          </div>
                          {typeof request.mutualFriends === "number" && (
                            <div className="request-meta">
                              {request.mutualFriends} mutual friend
                              {request.mutualFriends === 1 ? "" : "s"}
                            </div>
                          )}
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
