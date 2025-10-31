import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./FriendsListPage.css";
import Logo from "./logo.svg";
import FriendThumb from "./FriendThumb";
import mockFriends from "./mockFriends";
import { FRIENDS_STORAGE_KEY } from "./storageKeys";
import Header from "./Header";
import Footer from "./Footer";

const FriendsList = () => {
  const [friends, setFriends] = useState(() => {
    if (typeof window === "undefined") {
      return mockFriends;
    }

    try {
      const stored = window.localStorage.getItem(FRIENDS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } else {
        window.localStorage.setItem(
          FRIENDS_STORAGE_KEY,
          JSON.stringify(mockFriends)
        );
      }
    } catch (error) {
      console.warn("Unable to read stored friends, falling back to defaults.", error);
    }

    return mockFriends;
  });
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleUnfriend = (friendId) => {
    setFriends((prevFriends) =>
      prevFriends.filter((friend) => friend.id !== friendId)
    );
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(
        FRIENDS_STORAGE_KEY,
        JSON.stringify(friends)
      );
    } catch (error) {
      console.warn("Unable to persist friends list.", error);
    }
  }, [friends]);

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

      {friends.length > 0 && (
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

      {friends.length === 0 ? (
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
