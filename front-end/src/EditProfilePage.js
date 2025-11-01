import React from "react";
import "./EditProfilePage.css";
import { useNavigate} from "react-router-dom";
import { useState } from "react";
import Header from "./Header";
import Footer from "./Footer";


export default function EditProfilePage() {
  const navigate = useNavigate();
  const [photoUrl, setPhotoUrl] = useState("");

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhotoUrl(url);
  };

  const imageSrc =
    photoUrl ||
    `https://picsum.photos/200/200?seed=profile-${Math.floor(Math.random() * 1000)}`;

  return (
    <><Header title="Edit Profile" />
    <button
        className="back-home-btn"
        onClick={() => navigate("/profilepage")}
        style={{ marginTop: "20px" }}
      >
        ← Back
      </button>
    <div className="EditProfilePage">

      {/* Profile Picture block */}
      <div className="edit-photo-section">
      <div className="profile-photo-uploader">
        <img
          src={imageSrc}
          alt="Profile"
          className="profile-photo"
        />

        {/* Visible button that triggers the hidden file input */}
        <label htmlFor="profile-photo-input" className="upload-photo-btn">
          Upload Profile Photo
        </label>
        <input
          id="profile-photo-input"
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          hidden
        />
      </div>
    </div>

      <form className="edit-form">
        {/* Username */}
        <div className="edit-field">
          <label className="edit-label">Username</label>
          <input
            className="edit-input"
            placeholder="Enter username"
            defaultValue="BillWilliams123"
          />
        </div>

        {/* Name */}
        <div className="edit-field">
          <label className="edit-label">Name</label>
          <input
            className="edit-input"
            placeholder="Display name"
            defaultValue="Bill Williams"
          />
        </div>

        {/* About Me */}
        <div className="edit-field">
          <label className="edit-label">About Me:</label>
          <div className="aboutme-wrapper">
            <textarea
              className="edit-textarea"
              placeholder="Tell people about yourself (max 500 characters)"
              defaultValue=""
              maxLength={500}
            />
            <div className="char-hint">• max 500 characters</div>
          </div>
        </div>

        {/* Background */}
        <div className="edit-field">
          <label className="edit-label">Background</label>
          <input
            className="edit-input"
            placeholder="Where you're from / what shaped you"
            defaultValue=""
          />
        </div>

        {/* Interest */}
        <div className="edit-field">
          <label className="edit-label">Interest</label>
          <input
            className="edit-input"
            placeholder="Your interests"
            defaultValue=""
          />
        </div>

        {/* Save button */}
        <div className="save-wrapper">
          <button
            type="button"
            className="save-button"
            onClick={() => {
              // For now we just console.log to prove interaction
              console.log("Save clicked (not wired to backend yet)");
              alert("Profile changes saved (mock)");
            }}
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
    <Footer />
    </>
  );
}
