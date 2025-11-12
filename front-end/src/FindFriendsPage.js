import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./FindFriendsPage.css";
import Header from "./Header";
import Footer from "./Footer";

const BACKEND_BASE =
  (process.env.REACT_APP_BACKEND_URL &&
    process.env.REACT_APP_BACKEND_URL.replace(/\/$/, "")) ||
  "http://localhost:4000";
const FRIENDS_ENDPOINT = `${BACKEND_BASE}/api/friends`;

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
  const [matchingFriend, setMatchingFriend] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const trimmedTerm = searchTerm.trim().toLowerCase();

  useEffect(() => {
    let isMounted = true;

    if (!trimmedTerm) {
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
        url.searchParams.set("username", trimmedTerm);
        url.searchParams.set("limit", "1");
        const response = await fetch(url.toString(), {
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

        if (!isMounted) {
          return;
        }

        setMatchingFriend(first);
        setError(null);
      } catch (fetchError) {
        if (!isMounted || fetchError.name === "AbortError") {
          return;
        }

        console.warn("Unable to search friends via API.", fetchError);
        const fallback = FALLBACK_FRIENDS.find(
          (friend) =>
            friend.username.toLowerCase() === trimmedTerm ||
            `${friend.first_name} ${friend.last_name}`
              .toLowerCase()
              .includes(trimmedTerm)
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
  }, [trimmedTerm]);

  const messageDetails = useMemo(() => {
    if (loading) {
      return {
        type: "neutral",
        text: "Searching our community…",
      };
    }

    if (error && !matchingFriend) {
      return {
        type: "error",
        text: error,
      };
    }

    if (!trimmedTerm) {
      return {
        type: "neutral",
        text: "Search results will appear here once you enter a username.",
      };
    }

    if (matchingFriend) {
      if (error) {
        return {
          type: "info",
          text: error,
        };
      }

      return {
        type: "success",
        text: `We found ${matchingFriend.first_name}! Send them an invite below.`,
      };
    }

    return {
      type: "error",
      text: `No profile found for “${searchTerm}”. Try another username.`,
    };
  }, [loading, error, trimmedTerm, matchingFriend, searchTerm]);

  return (
    <>
      <Header title="Find Friends" />
      <Link to="/friends" className="back-btn">
        ← Back
      </Link>
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
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          disabled={loading}
        />
        <button type="button" disabled={loading || !matchingFriend}>
          {loading
            ? "Searching…"
            : matchingFriend
            ? "Invite via back end"
            : "Search"}
        </button>
      </div>

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
