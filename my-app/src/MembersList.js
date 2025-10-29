import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./MemberList.css";
import MemberThumb from "./MemberThumb";
import { useLocation } from 'react-router-dom';

const API_KEY = process.env.REACT_APP_MOCKAROO_KEY;

const MembersList = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const [members, setMembers] = useState([]);
  const canKick = !!(state && state.isBoardOwner);

  useEffect(() => {
    axios
      .get("https://my.api.mockaroo.com/members.json?key=dc8ece40", {
        headers: { "X-API-Key": "dc8ece40" , Accept: "application/json" },
        params: { count: 10 },
      })
      .then((res) => {
        setMembers(Array.isArray(res.data) ? res.data : [res.data]);
      })
      .catch((err) => {
        console.error("Mockaroo limit reached, using backup data:", err);
        setMembers([
          {
            id: 1,
            first_name: "Sherwin",
            last_name: "Peverell",
            username: "speverell0",
            country: "Indonesia",
            description: "non velit nec nisi vulputate",
            avatar: "https://i.pravatar.cc/100?img=1",
          },
          {
            id: 2,
            first_name: "Anna",
            last_name: "Petrova",
            username: "apetrova",
            country: "Russia",
            description: "non velit nec nisi vulputate",
            avatar: "https://i.pravatar.cc/100?img=2",
          },
        ]);
      });
  }, [id]);

  return (
    <div className="MemberList">
      <button className="back-button" onClick={() => window.history.back()}>
        ← Back to Board
      </button>
      <h1>Board Members</h1>
      <section className="member-grid">
        {members.map((member) => (
          <MemberThumb key={member.id} details={member} canKick={canKick} />
        ))}
      </section>
    </div>
  );
};

export default MembersList;