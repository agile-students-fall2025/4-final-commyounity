import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./FriendRequestsPage.css";
// import mockFriendRequestsFallback from "./mockFriendRequestsFallback";
import { FRIENDS_STORAGE_KEY } from "./storageKeys";
import Header from "./Header";
import Footer from "./Footer";

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
        const key = process.env.REACT_APP_KEY;
        if (!key) {
          throw new Error("REACT_APP_KEY is missing. Please add it to your .env file.");
        }

        const response = await fetch(
          `https://my.api.mockaroo.com/friends.json?key=${key}&count=6`,
          {
            headers: {
              "X-API-Key": key,
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Mockaroo responded with status ${response.status}`);
        }

        const payload = await response.json();
        const normalized = (Array.isArray(payload) ? payload : [payload]).map(
          normalizeRequest
        );

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

        console.warn(
          "Unable to load friend requests from Mockaroo.",
          fetchError
        );
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

  const handleAccept = (request) => {
    const fullName = `${request.first_name} ${request.last_name}`;

    setRequestsAndPersist((prev) =>
      prev.filter((item) => item.id !== request.id)
    );

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
          avatar:
            request.avatar ||
            `https://picsum.photos/seed/${request.username}/200/200`,
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

    setRequestsAndPersist((prev) =>
      prev.filter((item) => item.id !== request.id)
    );

    setFeedback({
      type: "info",
      message: `Declined ${fullName}'s friend request.`,
    });
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
