import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom';
import axios from 'axios'
import './EditScreen.css'
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

const EditScreen = () => {
  const { id } = useParams();  
  const [board, setBoard] = useState(null)
  const navigate = useNavigate();
  const [photoUrl, setPhotoUrl] = useState("");

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

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhotoUrl(url);
  };

  if (!board) return <div>Loading...</div>

  const imageSrc =
  photoUrl ||
  `https://picsum.photos/800/400?seed=board-${board.id}`;

  return (
    <><Header title="Edit Board" />
    <Link to={`/boards/${id}`} className="back-btn">
          ← Back
    </Link>
    <div className="EditScreen">
      

      <div className="edit-content">
      <div className="board-photo">
            <img src={imageSrc} alt={board.title} className="board-image" />
            <h2>{board.title}</h2>
            <div className="upload-wrap">
              <label htmlFor="board-photo-input" className="upload-button">
                Upload Board Photo
              </label>
              <input
                id="board-photo-input"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: "none" }}
              />
              {photoUrl && (
                <button
                  type="button"
                  className="clear-upload"
                  onClick={() => setPhotoUrl("")}
                >
                  Remove
                </button>
              )}
            </div>
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
    <Footer />
    </>
  )
}

export default EditScreen