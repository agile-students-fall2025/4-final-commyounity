import React, {useState} from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import "./CreateBoard.css";
import Header from "./Header";
import Footer from "./Footer";

const CreateBoard = () => {
    const [boardName, setBoardName] = useState("");
    const [description, setDescription] = useState("");
    const [photo, setPhoto] = useState(`https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/600/300`);
    const navigate = useNavigate();

    const handlePhotoUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
          setPhoto(URL.createObjectURL(file));
        }
      };

    const handleCreate = () => {
        if (!boardName) {
        alert("Please enter a board name before creating.");
        return;
        }
        alert(`Board "${boardName}" created successfully!(Can't actually create board, app doesn't have a back-end! Pretend the board is created for now!")`);
        navigate("/viewboards");
      };
      return (
        <>
        <Header title="Create a CommYOUnity Board" />
        <Link to="/home" className="back-btn">
            ← Back
          </Link> 
        <div className="CreateBoard">
          <div className="upload-section">
            <div className="photo-upload">
              {photo ? (
                <img src={photo} alt="Board" className="photo-preview" />
              ) : (
                <div className="photo-placeholder">Photo</div>
              )}
              <label htmlFor="photo-input" className="upload-button">
                Upload Board Photo
              </label>
              <input
                id="photo-input"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                hidden
              />
            </div>
          </div>
    
          <input
            type="text"
            placeholder="Enter Board Name"
            value={boardName}
            onChange={(e) => setBoardName(e.target.value)}
            className="text-input"
          />
    
          <textarea
            placeholder="Enter Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="text-input description"
          />
    
         <div className="button-group">
            <button onClick={() => navigate("/boards/:id/findmembers")} className="secondary-button">
              Find Members
            </button>
            <button onClick={() => navigate("/boards/:id/invite")} className="secondary-button">
              Invite Friends
            </button>
            <button onClick={handleCreate} className="primary-button">
              Create
            </button>
          </div>
        </div>
        <Footer />
        </>
      );
    };
    
    export default CreateBoard;