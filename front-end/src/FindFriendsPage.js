import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./FindFriendsPage.css";
import Header from "./Header";
import Footer from "./Footer";
import { FRIENDS_STORAGE_KEY } from "./storageKeys";

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

const buildFriendsUrl = (count = 12) => {
  const key = process.env.REACT_APP_KEY;

  if (!key) {
    throw new Error("REACT_APP_KEY is missing. Please add it to your .env file.");
  }

  const params = new URLSearchParams({
    key,
    count: String(count),
  });

  return `https://my.api.mockaroo.com/friends.json?${params.toString()}`;
};

const FindFriendsPage = () => {
  const [friends, setFriends] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [requestedUsernames, setRequestedUsernames] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const hydrateFromStorage = () => {
      if (typeof window === "undefined") {
        return false;
      }

      try {
        const stored = window.localStorage.getItem(FRIENDS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            if (isMounted) {
              setFriends(parsed);
              setError(null);
              setLoading(false);
            }
            return true;
          }
        }
      } catch (storageError) {
        console.warn("Unable to parse stored friends.", storageError);
      }

      return false;
    };

    const loadFriends = async () => {
      try {
        const response = await fetch(buildFriendsUrl(12), {
          headers: {
            Accept: "application/json",
            "X-API-Key": process.env.REACT_APP_KEY,
          },
        });

        if (!response.ok) {
          throw new Error(`Mockaroo responded with status ${response.status}`);
        }

        const payload = await response.json();
        const normalized = (Array.isArray(payload) ? payload : [payload]).map(
          normalizeFriend
        );

        if (!isMounted) {
          return;
        }

        setFriends(normalized);
        setError(null);

        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            FRIENDS_STORAGE_KEY,
            JSON.stringify(normalized)
          );
        }
      } catch (fetchError) {
        if (!isMounted) {
          return;
        }

        console.warn("Unable to load friends from Mockaroo.", fetchError);
        setFriends(FALLBACK_FRIENDS);
        setError(
          "Showing a few sample profiles while the live mock API is unavailable."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const alreadyHydrated = hydrateFromStorage();
    if (!alreadyHydrated) {
      loadFriends();
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const lookup = useMemo(() => {
    return friends.reduce((acc, friend) => {
      if (friend.username) {
        acc[friend.username.toLowerCase()] = friend;
      }
      return acc;
    }, {});
  }, [friends]);

  const trimmedTerm = searchTerm.trim().toLowerCase();
  const matchingFriend =
    trimmedTerm && !loading ? lookup[trimmedTerm] ?? null : null;

  const isAlreadySent = matchingFriend
    ? requestedUsernames.has(matchingFriend.username.toLowerCase())
    : false;

  const messageDetails = useMemo(() => {
    if (loading) {
      return {
        type: "neutral",
        text: "Fetching fresh profiles...",
      };
    }

    if (error) {
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
      return {
        type: isAlreadySent ? "info" : "success",
        text: isAlreadySent
          ? `Invite already sent to ${matchingFriend.first_name}.`
          : `We found ${matchingFriend.first_name}! Send them an invite below.`,
      };
    }

    return {
      type: "error",
      text: `No profile found for “${searchTerm}”. Try another username.`,
    };
  }, [loading, error, trimmedTerm, matchingFriend, searchTerm, isAlreadySent]);

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
          <button
            type="button"
            disabled={loading || !matchingFriend}
            onClick={() => {
              if (!matchingFriend) {
                return;
              }

              setRequestedUsernames((prev) => {
                const next = new Set(prev);
                next.add(matchingFriend.username.toLowerCase());
                return next;
              });
            }}
          >
            {loading
              ? "Loading…"
              : matchingFriend
              ? isAlreadySent
                ? "Requested"
                : "Send Invite"
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
