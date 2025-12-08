import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./FindFriendsPage.css";
import Header from "./Header";
import Footer from "./Footer";
import { fetchWithAuth, getStoredToken } from "./utils/authFetch";

const BACKEND_BASE =
  (process.env.REACT_APP_BACKEND_URL &&
    process.env.REACT_APP_BACKEND_URL.replace(/\/$/, "")) ||
  "http://localhost:4000";

const FRIENDS_ENDPOINT = `${BACKEND_BASE}/api/friends`;
const FRIEND_REQUESTS_ENDPOINT = `${BACKEND_BASE}/api/friend-requests`;

const FALLBACK_FRIENDS = [
  {
    id: "fallback-1",
    first_name: "Jordan",
    last_name: "Ramirez",
    username: "jordan.r",
    avatar: "https://picsum.photos/seed/jordan/200/200",
    online: true,
  },
  {
    id: "fallback-2",
    first_name: "Morgan",
    last_name: "Lee",
    username: "morganlee",
    avatar: "https://picsum.photos/seed/morgan/200/200",
    online: false,
  },
  {
    id: "fallback-3",
    first_name: "Skylar",
    last_name: "Nguyen",
    username: "skylar.ng",
    avatar: "https://picsum.photos/seed/skylar/200/200",
    online: true,
  },
];

const normalizeFriend = (friend, index) => {
  const fallbackId = `friend-${Date.now()}-${index}`;
  const id = friend.id ?? fallbackId;
  const firstName = friend.first_name ?? friend.firstName ?? "Friend";
  const lastName = friend.last_name ?? friend.lastName ?? "";
  const username =
    friend.username ??
    friend.handle ??
    `user-${typeof id === "string" ? id : fallbackId}`;

  return {
    id,
    first_name: firstName,
    last_name: lastName,
    username,
    avatar:
      friend.avatar ??
      friend.profilePhotoURL ??
      `https://picsum.photos/seed/${username}/200/200`,
    online:
      typeof friend.online === "boolean"
        ? friend.online
        : Boolean(friend.isOnline ?? friend.active),
  };
};

const FindFriendsPage = () => {
  // what user types
  const [searchInput, setSearchInput] = useState("");
  // what we actually submit to the backend
  const [submittedTerm, setSubmittedTerm] = useState("");
  // found friend
  const [matchingFriend, setMatchingFriend] = useState(null);
  // search state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // invite state
  const [inviteStatus, setInviteStatus] = useState("idle"); // idle | sending | sent | error
  const [inviteError, setInviteError] = useState(null);

  // whenever we change result friend, reset invite state
  useEffect(() => {
    setInviteStatus("idle");
    setInviteError(null);
  }, [matchingFriend?.id]);

  // Trigger search ONLY when submittedTerm changes
  useEffect(() => {
    let isMounted = true;

    if (!submittedTerm) {
      setMatchingFriend(null);
      setError(null);
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }

    const controller = new AbortController();

    const fetchMatch = async () => {
      setLoading(true);
      try {
        const url = new URL(FRIENDS_ENDPOINT);
        url.searchParams.set("username", submittedTerm);
        url.searchParams.set("limit", "1");

        const token = getStoredToken();
        if (!token) {
          throw Object.assign(new Error("Authentication required"), {
            code: "AUTH_REQUIRED",
          });
        }

        const response = await fetchWithAuth(url.toString(), {
          signal: controller.signal,
        });

        if (response.status === 400) {
          const payload = await response.json();
          if (isMounted) {
            setMatchingFriend(null);
            setError(
              payload?.error ||
                "Usernames may only include letters, numbers, dots, underscores, or hyphens."
            );
          }
          return;
        }

        if (!response.ok) {
          throw new Error(`Server responded with status ${response.status}`);
        }

        const payload = await response.json();
        const first =
          Array.isArray(payload?.data) && payload.data.length > 0
            ? normalizeFriend(payload.data[0], 0)
            : null;

        if (!isMounted) return;

        setMatchingFriend(first);
        setError(null);
      } catch (fetchError) {
        if (!isMounted || fetchError.name === "AbortError") return;

        console.warn("Unable to search friends via API.", fetchError);

        const fallback = FALLBACK_FRIENDS.find(
          (friend) =>
            friend.username.toLowerCase() === submittedTerm ||
            `${friend.first_name} ${friend.last_name}`
              .toLowerCase()
              .includes(submittedTerm)
        );

        setMatchingFriend(fallback ?? null);
        setError(
          fallback
            ? "Showing a cached profile because the friends service is unavailable."
            : "We couldn’t reach the friends service. Please try again."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMatch();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [submittedTerm]);

  const handleSearchClick = () => {
    const trimmed = searchInput.trim().toLowerCase();
    if (!trimmed) {
      setSubmittedTerm("");
      setMatchingFriend(null);
      setError(null);
      return;
    }
    setSubmittedTerm(trimmed);
  };

  const isFallbackFriend =
    matchingFriend && String(matchingFriend.id || "").startsWith("fallback");

  const handleSendInvite = async () => {
    if (!matchingFriend) return;

    if (isFallbackFriend) {
      setInviteStatus("error");
      setInviteError(
        "This is a demo profile from fallback data – you can only invite real users."
      );
      return;
    }

    setInviteStatus("sending");
    setInviteError(null);

    try {
      const response = await fetchWithAuth(FRIEND_REQUESTS_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: matchingFriend.username,
          // if later you add a custom message field in the UI, pass it here
          // message: "Hey, let’s connect on Commyounity!"
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setInviteStatus("error");
        setInviteError(
          payload?.error ||
            "We couldn’t send the invite. They might already have a pending request."
        );
        return;
      }

      setInviteStatus("sent");
      setInviteError(null);
    } catch (err) {
      console.error("Error sending friend invite:", err);
      setInviteStatus("error");
      setInviteError("Network error while sending invite. Please try again.");
    }
  };

  const messageDetails = useMemo(() => {
    if (loading) {
      return {
        type: "neutral",
        text: "Searching our community…",
      };
    }

    if (!submittedTerm) {
      return {
        type: "neutral",
        text: "Search results will appear here once you enter a username and hit Search.",
      };
    }

    if (error && !matchingFriend) {
      return {
        type: "error",
        text: error,
      };
    }

    if (matchingFriend) {
      if (error) {
        return {
          type: "info",
          text: error,
        };
      }

      if (inviteStatus === "sent") {
        return {
          type: "success",
          text: `Invite sent to ${matchingFriend.first_name}!`,
        };
      }

      return {
        type: "success",
        text: `We found ${matchingFriend.first_name}! Send them an invite below.`,
      };
    }

    return {
      type: "error",
      text: `No profile found for “${submittedTerm}”. Try another username.`,
    };
  }, [loading, error, submittedTerm, matchingFriend, inviteStatus]);

  return (
    <>
      <Header title="Find Friends" />
      <div className="FindFriendsPage">
        <p>
          <i>
            Search for new connections and send an invite once you find a match.
          </i>
        </p>

        <div className="findfriends-search">
          <input
            type="search"
            placeholder="Search by username"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            disabled={loading}
          />
          <button
            type="button"
            disabled={loading || !searchInput.trim()}
            onClick={handleSearchClick}
          >
            {loading ? "Searching…" : "Search"}
          </button>
        </div>

        {matchingFriend && (
          <div className="findfriends-result-card">
            <img
              src={matchingFriend.avatar}
              alt={`${matchingFriend.first_name} ${matchingFriend.last_name}`}
              className="findfriends-avatar"
            />
            <div className="findfriends-result-main">
              <h2>
                {matchingFriend.first_name} {matchingFriend.last_name}
              </h2>
              <p className="findfriends-username">@{matchingFriend.username}</p>
              <div className="findfriends-invite-row">
                <button
                  type="button"
                  onClick={handleSendInvite}
                  disabled={
                    inviteStatus === "sending" ||
                    inviteStatus === "sent" ||
                    isFallbackFriend
                  }
                  className="findfriends-invite-btn"
                >
                  {isFallbackFriend
                    ? "Invite unavailable"
                    : inviteStatus === "sending"
                    ? "Sending…"
                    : inviteStatus === "sent"
                    ? "Invite sent"
                    : "Send friend invite"}
                </button>
                {inviteError && (
                  <span className="findfriends-invite-error">
                    {inviteError}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <section
          className={`findfriends-demo-card ${messageDetails.type}`}
          aria-live="polite"
        >
          <p>{messageDetails.text}</p>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default FindFriendsPage;