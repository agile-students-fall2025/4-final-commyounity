import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './BoardDetail.css';
import { useNavigate } from "react-router-dom";
import BoardFeed from "./BoardFeed";

const API_KEY = process.env.REACT_APP_MOCKAROO_KEY;

const BoardDetail = () => {
  const { id } = useParams();            
  const [board, setBoard] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('https://my.api.mockaroo.com/mock_boards_data.json', {
      headers: { 'X-API-Key': API_KEY, Accept: 'application/json' },
      params: { count: 50 }            
    })
    .then(res => {
      const list = Array.isArray(res.data) ? res.data : [res.data];
      const found = list.find(item => String(item.id) === String(id));
      setBoard(found || list[0]);       
    })
    .catch(err => {
      console.error('Mockaroo error:', err);
      setBoard({
        id: 1,
        title: 'Your Cool Board',
        memberCount: 10,
        isOwner: true,
        coverPhotoURL: 'https://picsum.photos/800/400?seed=fallback',
        descriptionLong:
          'Fallback description: sample long text about this board.',
      });
    });
  }, [id]);

  if (!board) return <div>Loading…</div>;

  const imageSrc = `https://picsum.photos/800/400?seed=board-${board.id}`;

  const description =board.descriptionLong;

  return (
    <div className="BoardDetail">
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
            <button className="back-button" onClick={() => navigate(`/viewboards`)} >
              ← Back to Boards
            </button>
          </div>
          </div>
        </article>
      </section>
      <BoardFeed boardId={board.id} isOwner={board.isOwner} />
    </div>
  );
};

export default BoardDetail;