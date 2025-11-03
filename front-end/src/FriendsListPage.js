import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./FriendsListPage.css";
import FriendThumb from "./FriendThumb";
import { FRIENDS_STORAGE_KEY } from "./storageKeys";
import Header from "./Header";
import Footer from "./Footer";
import { fetchFriends } from "./api/friendsApi";

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

const FriendsList = () => {
  const [friends, setFriends] = useState([]);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Normalize API payload so the UI always has the fields it expects.
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

    // Attempt to read an existing list from localStorage before hitting Mockaroo.
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
              setHydrated(true);
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
        const fetched = await fetchFriends();
        if (!isMounted) {
          return;
        }
        const normalized = fetched.map(normalizeFriend);
        setFriends(normalized);
        setHydrated(true);
        setLoading(false);
      } catch (fetchError) {
        if (!isMounted) {
          return;
        }
        console.warn("Unable to load friends from Mockaroo.", fetchError);
        setFriends(FALLBACK_FRIENDS);
        setHydrated(false);
        setError(null);
        setLoading(false);
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

  useEffect(() => {
    let isMounted = true;

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
              setHydrated(true);
              setError(null);
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
        setHydrated(true);
        setError(null);
      } catch (fetchError) {
        if (!isMounted) {
          return;
        }

        console.warn("Unable to load friends from Mockaroo.", fetchError);
        setFriends(FALLBACK_FRIENDS);
        setHydrated(false);
        setError(
          "Showing a few sample friends while the live mock API is unavailable."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const alreadyHydrated = hydrateFromStorage();
    if (alreadyHydrated) {
      setLoading(false);
    } else {
      loadFriends();
    }

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(
        FRIENDS_STORAGE_KEY,
        JSON.stringify(friends)
      );
    } catch (storageError) {
      console.warn("Unable to persist friends list.", storageError);
    }
  }, [friends, hydrated]);

  const filteredFriends = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return friends.filter((friend) => {
      const matchesTerm =
        term.length === 0 ||
        `${friend.first_name} ${friend.last_name}`.toLowerCase().includes(term) ||
        friend.username.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "online" && friend.online) ||
        (statusFilter === "offline" && !friend.online);

      return matchesTerm && matchesStatus;
    });
  }, [friends, searchTerm, statusFilter]);

  return (
    <><Header title="View Your Friends" />
    <Link to="/friends" className="back-btn">
          ← Back 
    </Link>
    <div className="FriendsList">
      <p>
        <i>Here are your friends.</i>
      </p>

      {friends.length > 0 && !loading && (
        <div className="friendslist-controls">
          <input
            className="friendslist-search"
            type="search"
            placeholder="Search by name or username"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <select
            className="friendslist-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      )}

      {loading ? (
        <div className="friendslist-loading">
          Loading your friends…
        </div>
      ) : error ? (
        <div className="friendslist-error" role="alert">
          {error}
        </div>
      ) : friends.length === 0 ? (
        <div className="friendslist-empty">
          <p>You have no friends yet.</p>
          <button
            className="find-friends-btn"
            onClick={() => navigate("/friends/find")}
          >
            Find Friends
          </button>
        </div>
      ) : filteredFriends.length > 0 ? (
        <section className="friendslist-list">
          {filteredFriends.map((friend) => (
            <FriendThumb
              key={friend.id}
              details={friend}
              variant="list"
              onUnfriend={handleUnfriend}
            />
          ))}
        </section>
      ) : (
        <div className="friendslist-empty-search">
          <p>No friends match your search.</p>
        </div>
      )}
    </div>
    <Footer/>
    </>
  );
};

export default FriendsList;
