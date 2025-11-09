import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './BoardDetail.css';
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import BoardFeed from "./BoardFeed";
import Header from "./Header";
import Footer from "./Footer";

const BoardDetail = () => {
  const { id } = useParams();            
  const [board, setBoard] = useState(null);
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    console.log('fetching...')
    axios.get(`http://localhost:3000/api/boards/${id}`)
    .then(res => {
      if (!mounted) return;
      setBoard(res.data?.data || null);
    })
    .catch(err => {
      console.error('Backend error:', err);
      setError('Could not load this board.');
    });
  }, [id]);

  const handleLeaveBoard = async () => {
    if (leaving) return; 
    setLeaving(true);
    try {
      const response = await axios.post(`http://localhost:3000/api/boards/${id}/leave`);
      console.log("Leave request acknowledged by backend:", response.data);

      alert("You have left this board! (mock confirmation from backend)");

      navigate("/viewboards");
    } catch (error) {
      console.error(" Leave board failed:", error);
      alert("Could not communicate with backend. Check console for details.");
    } finally {
      setLeaving(false);
    }
  };

  if (!board) return <div>Loading…</div>;

  const description =board.descriptionLong;

  return (
    <><Header title={board.title} />
    <Link to="/viewboards" className="back-btn">
          ← Back
    </Link>
    <div className="BoardDetail">
      <section className="main-content">
        <article className="board" key={board.id}>
          <img alt={board.title} src={board.coverPhotoURL} className="board-image" />
          <div className="details">
            <p className="description">{description}</p>
            <p><strong>Members:</strong> {board.memberCount}</p>
            <div className="buttons">
            <button
              className="members-button"
              onClick={() =>
                navigate(`/boards/${board.id}/members`, {
                  state: { isBoardOwner: board.isOwner },
                })
              }
            >
              View Members
            </button>
            {board.isOwner && (
              <button
                className="edit-button"
                onClick={() => {
                  alert(
                    "If you are seeing this button in the 'Not Your Boards' section that is because Mockaroo has refreshed the data and the isOwner field is now set to true. Please disregard!"
                  );
                  navigate(`/boards/${board.id}/edit`, { state: { board } });
                }}
              >
                Edit Board
              </button>
            )}
            <button
                  className="leave-button"
                  onClick={handleLeaveBoard}   
                  disabled={leaving}          
                >
                  {leaving ? "Leaving…" : "Leave Board"}
                </button>
          </div>
          </div>
        </article>
      </section>
      <BoardFeed boardId={board.id} isOwner={board.isOwner} />
    </div>
    <Footer />
    </>
  );
};

export default BoardDetail;