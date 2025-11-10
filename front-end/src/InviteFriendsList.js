import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./InviteFriendsList.css";
import FriendThumb from "./FriendThumb";
import Header from "./Header";
import Footer from "./Footer";


const InviteFriendsList = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    console.log('fetching friends...')
    axios
      .get("http://localhost:3000/api/friends")
      .then((res) => {
        setFriends(Array.isArray(res.data.data) ? res.data.data : []);
      })
      .catch((err) => {
        console.error("Backend request failed:", err);
        setFriends([]); // fallback handled by backend now
      });
  }, [id]);

  const handleBack = () => {
    window.history.back();
  };

  return (
    <>
    <Header title="Invite Friends" />
    <button className="back-btn" onClick={handleBack}>
      ← Back
    </button>
    <div className="InviteFriendsList">
      <section className="friend-grid">
        {friends.map((friend) => (
          <FriendThumb key={friend.id} details={friend} />
        ))}
      </section>
    </div>
    <Footer/>
    </>
  );
};

export default InviteFriendsList;
