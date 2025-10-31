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
        const fallbackFriends = [
          {
            id: 1,
            first_name: "Emma",
            last_name: "Chen",
            username: "emma_chen",
            mutualCount: 12,
            profilePhotoURL: "https://picsum.photos/seed/emma/200/200",
            bio: "Loves art museums, matcha lattes, and weekend hikes 🌿",
            online: true,
          },
          {
            id: 2,
            first_name: "Liam",
            last_name: "Patel",
            username: "liam.codes",
            mutualCount: 8,
            profilePhotoURL: "https://picsum.photos/seed/liam/200/200",
            online: false,
          },
          {
            id: 3,
            first_name: "Sofia",
            last_name: "Reyes",
            username: "sofiareyes",
            mutualCount: 5,
            profilePhotoURL: "https://picsum.photos/seed/sofia/200/200",
            online: true,
          },
        ];
        setFriends(fallbackFriends);
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
