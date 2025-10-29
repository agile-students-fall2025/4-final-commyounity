import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./FriendsListPage.css";
import Logo from "./logo.svg";
import FriendThumb from "./FriendThumb";
import mockFriends from "./mockFriends";

const FriendsList = () => {
  const [friends, setFriends] = useState(mockFriends);
  const navigate = useNavigate();

  const handleUnfriend = (friendId) => {
    setFriends((prevFriends) =>
      prevFriends.filter((friend) => friend.id !== friendId)
    );
  };

  return (
    <div className="FriendsList">
      <header className="friendslist-header">
        {/* App logo */}
        <div className="friendslist-logo">
          <img src={Logo} alt="App logo" />
        </div>

        {/* Back button to main friends page */}
        <Link to="/friends" className="back-btn">
          ← Back to Friends Home
        </Link>
      </header>

      <h1>Friends List</h1>
      <p>
        <i>Here are your friends.</i>
      </p>

      {friends.length > 0 ? (
        <section className="friendslist-list">
          {friends.map((friend) => (
            <FriendThumb
              key={friend.id}
              details={friend}
              variant="list"
              onUnfriend={handleUnfriend}
            />
          ))}
        </section>
      ) : (
        <div className="friendslist-empty">
          <p>You have no friends yet.</p>
          <button
            className="find-friends-btn"
            onClick={() => navigate("/friends/find")}
          >
            Find Friends
          </button>
        </div>
      )}
    </div>
  );
};

export default FriendsList;
