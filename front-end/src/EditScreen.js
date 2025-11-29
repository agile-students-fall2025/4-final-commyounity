import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios'
import './EditScreen.css'
import Header from "./Header";
import Footer from "./Footer";

const EditScreen = () => {
  const { id } = useParams();  
  const [board, setBoard] = useState(null)
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  const [pendingTitle, setPendingTitle] = useState('');              
  const [pendingDescription, setPendingDescription] = useState('');  
  const [photoUrl, setPhotoUrl] = useState("");                      
  const [pendingPhotoFile, setPendingPhotoFile] = useState(null);    

  useEffect(() => {
    console.log("Fetching boards from backend...");
    const token = localStorage.getItem('token');

    if (!token) {
      console.error('No JWT token found in localStorage');
      setError('You must be logged in to edit boards.');
      return;
    }

    axios
      .get("http://localhost:4000/api/boards", {
        headers: {
          Authorization: `jwt ${token}`,  
        },
      })
      .then((response) => {
        const boards = response.data.data; 
        const selected = boards.find((b) => String(b.id || b._id) === String(id));
        if (selected) {
          setBoard(selected);
          setPendingTitle(selected.title || '');
          setPendingDescription(selected.descriptionLong || '');
        } else {
          setError("Board not found.");
        }
      })
      .catch((err) => {
        console.error("Backend request failed:", err);
        setError("Could not load board data.");
      });
  }, [id]); 
  
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (photoUrl) URL.revokeObjectURL(photoUrl);

    const url = URL.createObjectURL(file);
    setPhotoUrl(url);
    setPendingPhotoFile(file); 
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in to save changes.');
        navigate('/login');
        return;
      }

      const formData = new FormData();
      formData.append('title', pendingTitle);
      formData.append('descriptionLong', pendingDescription);
      if (pendingPhotoFile) {
        formData.append('photo', pendingPhotoFile); 
      }

      const res = await axios.post(
        `http://localhost:4000/api/boards/${id}/edit`, 
        formData,
        { 
          headers: { 
            "Content-Type": "multipart/form-data",
            Authorization: `JWT ${token}`, 
          } 
        }
      );

      console.log("Edit posted:", res.data);
      navigate("/viewboards");
    } catch (err) {
      console.error("Save failed:", err);
      alert("Save failed — check backend connection/logs.");
    }
  };

  if (error) return <div className="EditScreen error">{error}</div>;
  if (!board) return <div>Loading...</div>

  const displayImage = photoUrl || board.coverPhotoURL;

  return (
    <>
      <Header title="Edit Board" />
      <Link to={`/boards/${board.id}`} className="back-btn">
        ← Back
      </Link>
      <div className="EditScreen">
        <div className="edit-content">
          <div className="board-photo">
            <img src={displayImage} alt={board.title} className="board-image" />
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
            </div>
          </div>

          <form className="edit-form" onSubmit={handleSave}>
            <label>Board Name</label>
            <input
              type="text"
              value={pendingTitle}
              onChange={(e) => setPendingTitle(e.target.value)}
            />

            <label>Description</label>
            <textarea
              value={pendingDescription}
              onChange={(e) => setPendingDescription(e.target.value)}
            />
            <p className="char-limit">• max 500 characters</p>

            <div className="member-actions">
              <button
                type="button"
                className="invite"
                onClick={() => navigate(`/boards/${board.id}/invite`)}
              >
                Invite Friends
              </button>
              <button
                type="button"
                className="find"
                onClick={() => navigate(`/boards/${board.id}/findmembers`)}
              >
                Find Members
              </button>
            </div>

            <button type="submit" className="save-button">
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