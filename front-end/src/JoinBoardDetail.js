import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './JoinBoardDetail.css';
import { useNavigate } from "react-router-dom";


const API_KEY = process.env.REACT_APP_MOCKAROO_KEY;


const JoinBoardDetail = () => {
 const { id } = useParams();
 const [board, setBoard] = useState(null);
 const navigate = useNavigate();


 useEffect(() => {
   axios
     .get('https://my.api.mockaroo.com/mock_boards_data.json', {
       headers: { 'X-API-Key': 'dc8ece40', Accept: 'application/json' },
       params: { count: 50 },
     })
     .then(res => {
       const list = Array.isArray(res.data) ? res.data : [res.data];
       const found = list.find(item => String(item.id) === String(id));
       setBoard(found || list[0]);
     })
     .catch(err => {
       console.error('Mockaroo error:', err);
       setBoard({
         id: 3,
         title: 'Sample Board',
         memberCount: 15,
         isOwner: false,
         coverPhotoURL: 'https://picsum.photos/800/400?seed=fallback',
         descriptionLong:
           'Fallback description: This is a placeholder board for users who haven’t joined yet.',
       });
     });
 }, [id]);


 if (!board) return <div>Loading…</div>;


 const imageSrc = `https://picsum.photos/800/400?seed=board-${board.id}`;
 const description = board.descriptionLong;


 return (
   <div className="JoinBoardDetail">
     <h1>{board.title}</h1>
     <section className="main-content">
       <article className="board" key={board.id}>
         <img alt={board.title} src={imageSrc} className="board-image" />
         <div className="details">
           <p className="description">{description}</p>
           <p><strong>Members:</strong> {board.memberCount}</p>
           <div className="buttons">
             <button
               className="members-button"
               onClick={() =>
                 navigate(`/boards/${board.id}/members`, {
                   state: { isBoardOwner: false },
                 })
               }
             >
               View Members
             </button>


             <button
               className="join-button"
               onClick={() => {
                 alert("You've joined this board! (pretend)");
                 navigate('/browseboards');
               }}
             >
               Join Board
             </button>


             <button
               className="back-button"
               onClick={() => navigate('/browseboards')}
             >
               ← Back to Browse Boards
             </button>
           </div>
         </div>
       </article>
     </section>
   </div>
 );
};




export default JoinBoardDetail;
 
