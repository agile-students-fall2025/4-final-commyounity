import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './BoardDetail.css';
import { useNavigate, Link } from "react-router-dom";
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

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No JWT token found for BoardDetail');
      setError('You must be logged in to view this board.');
      return;
    }

    axios.get(`http://localhost:4000/api/boards/${id}`, {
      headers: {
        Authorization: `JWT ${token}`,
      },
    })
    .then(res => {
      if (!mounted) return;
      setBoard(res.data?.data || null);
    })
    .catch(err => {
      console.error('Backend error:', err);
      setError('Could not load this board.');
    });

    return () => { mounted = false; };
  }, [id]);

  const handleLeaveBoard = async () => {
    if (!board) return;
    if (leaving) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert('You must be logged in to leave this board.');
      navigate('/login');
      return;
    }
  
    if (board.isOwner && board.memberCount === 1) {
      const confirmDelete = window.confirm(
        "You are the only member of this board. " +
          "If you leave, the entire board and its content will be permanently deleted.\n\n" +
          "Do you still want to leave?"
      );
      if (!confirmDelete) return;
    }
  
    setLeaving(true);
  
    try {
      const response = await axios.post(
        `http://localhost:4000/api/boards/${id}/leave`,
        {},
        {
          headers: {
            Authorization: `JWT ${token}`,   // 🔐 include token for leave route too
          },
        }
      );
  
      alert(response.data.message || "You left the board.");
      navigate("/viewboards");
    } catch (err) {
      console.error("Leave error:", err);
      alert("Error leaving the board. Check console for details.");
    } finally {
      setLeaving(false);
    }
  };

  if (error) {
    return <div>{error}</div>;
  }

  if (!board) return <div>Loading…</div>;

  const description = board.descriptionLong;

  return (
    <>
      <Header title={board.title} />
      <div className="BoardDetail">
        <section className="main-content">
          <article className="board" key={board.id || board._id}>
            <img alt={board.title} src={board.coverPhotoURL} className="board-image" />
            <div className="details">
              <p className="description">{description}</p>
              <p><strong>Members:</strong> {board.memberCount}</p>
              <div className="buttons">
                <button
                  className="members-button"
                  onClick={() =>
                    navigate(`/boards/${board.id}/members`, {
                      state: {
                        isBoardOwner: board.isOwner,
                        boardId: board.id,               
                        memberCount: board.memberCount,   
                      },
                    })
                  }
                >
                  View Members
                </button>
                {board.isOwner && (
                  <button
                    className="edit-button"
                    onClick={() => {
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