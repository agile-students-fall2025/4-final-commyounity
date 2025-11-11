import React, { useEffect, useState } from "react";
import { useParams} from "react-router-dom";
import axios from "axios";
import "./MemberList.css";
import MemberThumb from "./MemberThumb";
import { useLocation } from 'react-router-dom';
import Header from "./Header";
import Footer from "./Footer";


const MembersList = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const canKick = !!(state && state.isBoardOwner);
  const [data, setData] = useState([])
  const [error, setError] = useState(null)
  const initialBoardId = state?.boardId ?? id;           
  const [memberCount, setMemberCount] = useState(state?.memberCount); 
  useEffect(() => {
    
    axios('http://localhost:4000/api/members')
      .then(response => {
        // extract the data from the server response
        setData(response.data.data)
      })
      .catch(err => {
        console.error('Backend request failed:', err)
        setError('Could not load boards.')
      })
  }, [id]);
  const handleBack = () => {
    window.history.back();
  };

  return (
    <>
    <Header title="Members" />
    <button className="back-btn" onClick={handleBack}>
      ← Back
    </button>
    <div className="MemberList">
      <section className="member-grid">
        {data.map((member) => (
         <MemberThumb
         key={member.id}
         details={member}
         canKick={canKick}
         boardId={initialBoardId}
         memberCount={memberCount}
       />
        ))}
      </section>
    </div>
    <Footer />
    </>
  );
};

export default MembersList;