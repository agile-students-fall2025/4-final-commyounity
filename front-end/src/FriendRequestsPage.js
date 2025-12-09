import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./FriendRequestsPage.css";
import Header from "./Header";
import Footer from "./Footer";
import { fetchWithAuth, getStoredToken } from "./utils/authFetch";
import { FRIENDS_STORAGE_KEY } from "./storageKeys";

const BACKEND_BASE =
  (process.env.REACT_APP_BACKEND_URL &&
    process.env.REACT_APP_BACKEND_URL.replace(/\/$/, "")) ||
  "http://localhost:4000";

const FRIEND_REQUESTS_ENDPOINT = `${BACKEND_BASE}/api/friend-requests`;
const BOARD_INVITES_BASE = `${BACKEND_BASE}/api/boardinvites`;
const BOARD_INVITES_LIST_ENDPOINT = `${BOARD_INVITES_BASE}/invites`;


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
    requester: request.requester,
    first_name: firstName,
    last_name: lastName,
    username,
    avatar:
      request.avatar || 
      request.profilePhotoURL ||
      `https://picsum.photos/seed/${username}/200/200`,
    message: request.message,
    mutualFriends:
      typeof request.mutualFriends === "number" ? request.mutualFriends : undefined,
  };
};

const FriendRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [boardInvites, setBoardInvites] = useState([]);
  const [boardInvitesError, setBoardInvitesError] = useState(null);

  const [feedback, setFeedback] = useState(null);
  const hadCachedRequestsRef = useRef(false);
  const [authError, setAuthError] = useState(null);

  const fetchUserProfile = async (userId) => {
    const token = getStoredToken();
    if (!token) {
      throw Object.assign(new Error("Authentication required"), {
        code: "AUTH_REQUIRED",
      });
    }

    const res = await fetch(`${BACKEND_BASE}/api/users/${userId}`, {
      headers: {
        Authorization: `JWT ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch user ${userId}`);
    }

    const payload = await res.json();
    return payload.data;
  };

  useEffect(() => {
    let isMounted = true;

    const fetchRequests = async () => {
      setLoading(true);
      try {
        const token = getStoredToken();
        if (!token) {
          throw Object.assign(new Error("Authentication required"), {
            code: "AUTH_REQUIRED",
          });
        }

        const response = await fetchWithAuth(FRIEND_REQUESTS_ENDPOINT);

        if (!response.ok) {
          throw new Error(`Server responded with status ${response.status}`);
        }

        const payload = await response.json();

        let normalized = Array.isArray(payload?.data)
          ? payload.data.map(normalizeRequest)
          : [];

        normalized = await Promise.all(
          normalized.map(async (req) => {
            const requesterId = req.requester;
            if (!requesterId) return req;

            try {
              const user = await fetchUserProfile(requesterId);

              return {
                ...req,
                avatar: user.avatar || req.avatar,
                first_name: user.first_name || req.first_name,
                last_name: user.last_name || req.last_name,
                username: user.username || req.username,
              };
            } catch (err) {
              console.warn("Failed to fetch user profile for request:", err);
              return req;
            }
          })
        );

        if (!isMounted) return;

        setRequests(normalized);
        hadCachedRequestsRef.current = normalized.length > 0;
        setError(null);
      } catch (fetchError) {
        if (!isMounted) return;

        console.warn("Unable to load friend requests from the API.", fetchError);
        const isAuth =
          fetchError?.code === "AUTH_REQUIRED" ||
          fetchError?.code === "AUTH_FORBIDDEN";
        setError(
          isAuth
            ? "Please sign in to load your friend requests."
            : "We couldn't load your friend requests right now."
        );
        if (isAuth) {
          setAuthError("Authentication required to view friend requests.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const fetchBoardInvites = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setBoardInvites([]);
          return;
        }

        const res = await fetch(BOARD_INVITES_LIST_ENDPOINT, {
          headers: {
            Authorization: `JWT ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Server responded with status ${res.status}`);
        }

        const payload = await res.json();
        const list = Array.isArray(payload?.data) ? payload.data : [];

        if (!isMounted) return;

        setBoardInvites(list);
        setBoardInvitesError(null);
      } catch (err) {
        if (!isMounted) return;
        console.warn("Unable to load board invites.", err);
        setBoardInvites([]);
        setBoardInvitesError(
          "We couldn't load your board invites right now."
        );
      }
    };

    fetchRequests();
    fetchBoardInvites();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!feedback) return undefined;

    const timer = window.setTimeout(() => setFeedback(null), 3500);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const updateStoredFriends = (updater) => {
    if (typeof window === "undefined") return;

    try {
      const stored = window.localStorage.getItem(FRIENDS_STORAGE_KEY);
      const existing = stored ? JSON.parse(stored) : null;
      const existingFriends = Array.isArray(existing?.friends)
        ? existing.friends
        : Array.isArray(existing)
        ? existing
        : [];
      const next = updater(existingFriends);
      window.localStorage.setItem(
        FRIENDS_STORAGE_KEY,
        JSON.stringify(next)
      );
    } catch (storageError) {
      console.warn("Unable to update stored friends.", storageError);
    }
  };

  const handleAccept = async (request) => {
    const fullName = `${request.first_name} ${request.last_name}`;

    try {
      const token = getStoredToken();
      if (!token) {
        throw Object.assign(new Error("Authentication required"), {
          code: "AUTH_REQUIRED",
        });
      }

      const response = await fetchWithAuth(
        `${FRIEND_REQUESTS_ENDPOINT}/${encodeURIComponent(request.id)}/accept`,
        { method: "POST" }
      );

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      const payload = await response.json();

      setRequests((prev) => prev.filter((item) => item.id !== request.id));

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
        message:
          actionError?.code === "AUTH_REQUIRED" ||
          actionError?.code === "AUTH_FORBIDDEN"
            ? "Please sign in to accept friend requests."
            : "We couldn’t accept the request. Please try again shortly.",
      });
    }
  };

  const handleDecline = async (request) => {
    const fullName = `${request.first_name} ${request.last_name}`;

    try {
      const token = getStoredToken();
      if (!token) {
        throw Object.assign(new Error("Authentication required"), {
          code: "AUTH_REQUIRED",
        });
      }

      const response = await fetchWithAuth(
        `${FRIEND_REQUESTS_ENDPOINT}/${encodeURIComponent(request.id)}/decline`,
        { method: "POST" }
      );

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      await response.json();

      setRequests((prev) => prev.filter((item) => item.id !== request.id));

      setFeedback({
        type: "info",
        message: `Declined ${fullName}'s friend request.`,
      });
    } catch (actionError) {
      console.warn("Unable to decline friend request.", actionError);
      setFeedback({
        type: "error",
        message:
          actionError?.code === "AUTH_REQUIRED" ||
          actionError?.code === "AUTH_FORBIDDEN"
            ? "Please sign in to decline friend requests."
            : "We couldn’t decline the request. Please try again shortly.",
      });
    }
  };


  const handleBoardInviteAccept = async (invite) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setFeedback({
          type: "error",
          message: "Your session expired. Please log in again.",
        });
        return;
      }

      const res = await fetch(
        `${BOARD_INVITES_BASE}/invites/${encodeURIComponent(invite.id)}/accept`,
        {
          method: "POST",
          headers: {
            Authorization: `JWT ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error(`Server responded with status ${res.status}`);
      }

      await res.json();

      setBoardInvites((prev) => prev.filter((i) => i.id !== invite.id));

      setFeedback({
        type: "success",
        message: `You joined “${invite.boardTitle}”.`,
      });
    } catch (err) {
      console.warn("Unable to accept board invite.", err);
      setFeedback({
        type: "error",
        message: "We couldn’t accept the board invite. Please try again.",
      });
    }
  };

  const handleBoardInviteDecline = async (invite) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setFeedback({
          type: "error",
          message: "Your session expired. Please log in again.",
        });
        return;
      }

      const res = await fetch(
        `${BOARD_INVITES_BASE}/invites/${encodeURIComponent(invite.id)}/decline`,
        {
          method: "POST",
          headers: {
            Authorization: `JWT ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error(`Server responded with status ${res.status}`);
      }

      await res.json();

      setBoardInvites((prev) => prev.filter((i) => i.id !== invite.id));

      setFeedback({
        type: "info",
        message: `You declined the invite to “${invite.boardTitle}”.`,
      });
    } catch (err) {
      console.warn("Unable to decline board invite.", err);
      setFeedback({
        type: "error",
        message: "We couldn’t decline the board invite. Please try again.",
      });
    }
  };

  return (
    <>
      <Header title="Friend Requests" />
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
                <h2>No pending friend requests</h2>
                <p>
                  You’re all caught up for now. Check back later or keep building
                  your commYOUnity.
                </p>
                <Link to="/friends/find" className="request-empty-cta">
                  Find Friends
                </Link>
              </div>
            )}

            <section className="boardinvites-section">
              <div className="boardinvites-header">
                <h2>Board Invites</h2>
                <p>Boards other members have invited you to join.</p>
              </div>

              {boardInvitesError && (
                <div className="request-error" role="alert">
                  {boardInvitesError}
                </div>
              )}

              {boardInvites.length > 0 ? (
                <div className="boardinvites-list">
                  {boardInvites.map((invite) => (
                    <article key={invite.id} className="boardinvite-card">
                      {invite.boardCoverPhotoURL && (
                        <img
                          className="boardinvite-cover"
                          src={invite.boardCoverPhotoURL}
                          alt={invite.boardTitle}
                        />
                      )}
                      <div className="boardinvite-meta">
                        <h3>{invite.boardTitle}</h3>
                        <p>
                          Invited by{" "}
                          <strong>
                            {invite.invitedByName}
                            {invite.invitedByUsername
                              ? ` (@${invite.invitedByUsername})`
                              : ""}
                          </strong>
                        </p>
                      </div>
                      <div className="boardinvite-buttons">
                        <button
                          className="accept"
                          onClick={() => handleBoardInviteAccept(invite)}
                        >
                          Join Board
                        </button>
                        <button
                          className="decline"
                          onClick={() => handleBoardInviteDecline(invite)}
                        >
                          Decline
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                !boardInvitesError && (
                  <p className="boardinvites-empty">
                    No board invitations at the moment.
                  </p>
                )
              )}
            </section>
          </>
        )}
      </div>
      <Footer />
    </>
  );
};

export default FriendRequestsPage;