import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './EditScreen.css'
import { useNavigate } from "react-router-dom";
import Header from "./Header";

const EditScreen = () => {
  const [board, setBoard] = useState(null)
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get('https://my.api.mockaroo.com/mock_boards_data.json?key=dc8ece40')
      .then(response => {
        const data = Array.isArray(response.data) ? response.data[0] : response.data
        setBoard(data)
      })
      .catch(err => {
        console.error('Error fetching board data:', err)
        setBoard({
          id: 1,
          title: 'Your Cool Board',
          descriptionLong: 'Fallback example description for edit screen.',
          coverPhotoURL: 'https://picsum.photos/400/200?seed=fallback',
        })
      })
  }, [])

  

  if (!board) return <div>Loading...</div>

  const imageSrc = `https://picsum.photos/800/400?seed=board-${board.id}`;

  return (
    <><Header title="Edit Board" />
    <button className="back-button" onClick={() => navigate(`/boards/${board.id}`)}>
        ← Back
      </button>
    <div className="EditScreen">
      

      <div className="edit-content">
        <div className="board-photo">
          <img
            src= {imageSrc}
            alt={board.title}
            className="board-image"
          />
          <h2>{board.title}</h2>
        </div>

        <form className="edit-form">
          <label>Board Name</label>
          <input type="text" defaultValue={board.title} />

          <label>Description</label>
          <textarea defaultValue={board.descriptionLong}></textarea>
          <p className="char-limit">• max 500 characters</p>

          <div className="member-actions">
            <button type="button" className="invite" onClick={() => navigate(`/boards/${board.id}/invite`)}>
              Invite Friends
            </button>
            <button type="button" className="find" onClick={() => navigate(`/boards/${board.id}/findmembers`)}>
              Find Members
            </button>
          </div>

          <button type="submit" className="save-button" onClick={() => {alert("Can't save changes, app doesn't have a back-end! Pretend the changes are saved for now!"); navigate("/viewboards");}}>
            Save Changes
          </button>
        </form>
      </div>
    </div>
    </>
  )
}

export default EditScreen