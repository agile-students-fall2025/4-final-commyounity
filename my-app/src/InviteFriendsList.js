import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./InviteFriendsList.css";
import FriendThumb from "./FriendThumb";
// import mockFriends from "./mockFriends";

const InviteFriendsList = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    axios
      .get("https://my.api.mockaroo.com/friends.json?key=dc8ece40", {
        headers: { "X-API-Key": "dc8ece40", Accept: "application/json" },
        params: { count: 10 },
      })
      .then((res) => {
        setFriends(Array.isArray(res.data) ? res.data : [res.data]);
      })
      .catch((err) => {
        console.error("Mockaroo limit reached, using backup data:", err);
        // setFriends(mockFriends);
      });
  }, [id]);

  return (
    <div className="InviteFriendsList">
      <button className="back-button" onClick={() => navigate(`/boards/${id}/edit`)}>
        ← Back to Board
      </button>

      <h1>Your Friends</h1>

      <section className="friend-grid">
        {friends.map((friend) => (
          <FriendThumb key={friend.id} details={friend} />
        ))}
      </section>
    </div>
  );
};

export default InviteFriendsList;
