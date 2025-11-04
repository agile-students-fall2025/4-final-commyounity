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

  useEffect(() => {
    let mounted = true;
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
                    "If you are seeing this button in the 'Not Your Boards' section that is because Mockaroo has refreshed the data and the isOwner field is now set to true. This app doesn't yet have a back-end, but this will be fixed once the back-end is set up. Please disregard!"
                  );
                  navigate(`/boards/${board.id}/edit`, { state: { board } });
                }}
              >
                Edit Board
              </button>
            )}
            <button
              className="leave-button"
              onClick={() => {
                alert("You are leaving this board! (pretend)");
                navigate("/viewboards");
              }}
            >
              Leave Board
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