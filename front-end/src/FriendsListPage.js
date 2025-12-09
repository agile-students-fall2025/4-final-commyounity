import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./FriendsListPage.css";
import FriendThumb from "./FriendThumb";
import Header from "./Header";
import Footer from "./Footer";
import { fetchWithAuth, getStoredToken } from "./utils/authFetch";

const BACKEND_BASE =
  (process.env.REACT_APP_BACKEND_URL &&
    process.env.REACT_APP_BACKEND_URL.replace(/\/$/, "")) ||
  "http://localhost:4000";
const FRIENDS_ENDPOINT = `${BACKEND_BASE}/api/friends`;

const FALLBACK_FRIENDS = [
  // {
  //   id: "fallback-1",
  //   first_name: "Jordan",
  //   last_name: "Ramirez",
  //   username: "jordan.r",
  //   avatar: "https://picsum.photos/seed/jordan/200/200",
  //   online: true,
  // },
  // {
  //   id: "fallback-2",
  //   first_name: "Morgan",
  //   last_name: "Lee",
  //   username: "morganlee",
  //   avatar: "https://picsum.photos/seed/morgan/200/200",
  //   online: false,
  // },
  // {
  //   id: "fallback-3",
  //   first_name: "Skylar",
  //   last_name: "Nguyen",
  //   username: "skylar.ng",
  //   avatar: "https://picsum.photos/seed/skylar/200/200",
  //   online: true,
  // },
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

const FriendsList = () => {
  const [friends, setFriends] = useState([]);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadFriends = async () => {
      try {
        const token = getStoredToken();
        if (!token) {
          throw Object.assign(new Error("Authentication required"), {
            code: "AUTH_REQUIRED",
          });
        }

        const response = await fetchWithAuth(FRIENDS_ENDPOINT);

        if (!response.ok) {
          throw new Error(`Server responded with status ${response.status}`);
        }

        const payload = await response.json();
        const normalized = (Array.isArray(payload?.data)
          ? payload.data
          : [payload?.data]
        )
          .filter(Boolean)
          .map((friend, index) => normalizeFriend(friend, index));

        if (!isMounted) return;

        setFriends(normalized);
        setError(null);
      } catch (fetchError) {
        if (!isMounted) return;

        console.warn("Unable to load friends from the Express API.", fetchError);
        const isAuth =
          fetchError?.code === "AUTH_REQUIRED" ||
          fetchError?.code === "AUTH_FORBIDDEN";
        setFriends(FALLBACK_FRIENDS);
        setError(
          isAuth
            ? "Please sign in to view your friends."
            : "Showing a few sample friends while the friends service is unavailable."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadFriends();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleUnfriend = (friendId) => {
    setFriends((prevFriends) =>
      prevFriends.filter((friend) => friend.id !== friendId)
    );
  };

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
    <>
      <Header title="View Your Friends" />
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
          <div className="friendslist-loading">Loading your friends…</div>
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
      <Footer />
    </>
  );
};

export default FriendsList;
