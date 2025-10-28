import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './BoardDetail.css';
import { Link } from 'react-router-dom';

const BoardDetail = () => {
  const { id } = useParams();            
  const [board, setBoard] = useState(null);

  useEffect(() => {
    axios.get('https://my.api.mockaroo.com/mock_boards_data.json', {
      headers: { 'X-API-Key': 'dc8ece40', Accept: 'application/json' },
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
            <Link to={`/boards/${board.id}/members`}>
              <button className="members-button">View Members</button>
            </Link>
            <Link to={`/boards/${board.id}/edit`}>
            <button className="edit-button" onClick={() => alert("Edit coming soon!")}>
              Edit Board
            </button>
            </Link>
            <button className="back-button" onClick={() => window.history.back()}>
              ← Back to Boards
            </button>
          </div>
          </div>
        </article>
      </section>
    </div>
  );
};

export default BoardDetail;