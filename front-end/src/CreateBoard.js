import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./CreateBoard.css";
import Header from "./Header";
import Footer from "./Footer";

const CreateBoard = () => {
  const [boardName, setBoardName] = useState("");
  const [description, setDescription] = useState("");
  const [photoPreview, setPhotoPreview] = useState(
    `https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/600/300`
  );
  const [photoFile, setPhotoFile] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const handlePhotoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    setError("");
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleCreate = async () => {
    if (!boardName.trim()) {
      alert("Please enter a board name before creating.");
      return;
    }
  
    try {
      const formData = new FormData();
      formData.append("title", boardName);
      formData.append("descriptionLong", description);
      const fileInput = document.getElementById("photo-input");
      if (fileInput?.files?.[0]) {
        formData.append("photo", fileInput.files[0]);
      }
      const response = await fetch("http://localhost:4000/api/boards/create", {
        method: "POST",
        body: formData,
      });
  
      const data = await response.json();
      console.log("[CREATE BOARD RESPONSE]", data);
  
      if (response.ok) {
        alert(`Board "${boardName}" created successfully!`);
        navigate("/home");
      } else {
        alert(`Error: ${data.message || "Failed to create board."}`);
      }
    } catch (err) {
      console.error("Board creation failed:", err);
      alert("Something went wrong while creating the board.");
    }
  };

  return (
    <>
      <Header title="Create a CommYOUnity Board" />
      <Link to="/home" className="back-btn">← Back</Link>

      <div className="CreateBoard">
        <div className="upload-section">
          <div className="photo-upload">
            {photoPreview ? (
              <img src={photoPreview} alt="Board" className="photo-preview" />
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

        {error && (
          <p className="error-msg" role="alert" style={{ marginTop: 8 }}>
            {error}
          </p>
        )}

        <div className="button-group">
          <button
            onClick={() => navigate("/boards/:id/findmembers")}
            className="secondary-button"
            type="button"
          >
            Find Members
          </button>
          <button
            onClick={() => navigate("/boards/:id/invite")}
            className="secondary-button"
            type="button"
          >
            Invite Friends
          </button>
          <button
            onClick={handleCreate}
            className="primary-button"
            disabled={submitting}
            type="button"
          >
            {submitting ? "Creating…" : "Create"}
          </button>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default CreateBoard;