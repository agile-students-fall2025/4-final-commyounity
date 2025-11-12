import React, { useState, useEffect } from "react";
import "./EditProfilePage.css";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

export default function EditProfilePage() {
  const navigate = useNavigate();
  const [photoUrl, setPhotoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form fields
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    aboutMe: "",
    background: "",
    interests: ""
  });

  // Load profile data when component mounts
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/profile", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({
          username: data.username || "",
          name: data.name || "",
          aboutMe: data.aboutMe || "",
          background: data.background || "",
          interests: data.interests || ""
        });
        if (data.profilePhoto) {
          setPhotoUrl(data.profilePhoto);
        }
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const previewUrl = URL.createObjectURL(file);
    setPhotoUrl(previewUrl);

    // Upload to backend
    try {
      const formData = new FormData();
      formData.append('profilePhoto', file);

      const response = await fetch("http://localhost:4000/api/profile/photo", {
        method: "POST",
        credentials: "include",
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setPhotoUrl(data.photoUrl);
        alert("Profile photo uploaded successfully!");
      } else {
        alert(data.error || "Failed to upload photo");
        setPhotoUrl(""); // Reset on error
      }
    } catch (err) {
      console.error("Error uploading photo:", err);
      alert("Failed to upload photo. Please try again.");
      setPhotoUrl(""); // Reset on error
    }
  };

  const handleSave = async () => {
    // Validate About Me length
    if (formData.aboutMe.length > 500) {
      alert("About Me cannot exceed 500 characters");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("http://localhost:4000/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        alert("Profile updated successfully!");
        navigate("/profilepage");
      } else {
        alert(data.error || "Failed to update profile");
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header title="Edit Profile" />
        <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>
        <Footer />
      </>
    );
  }

  const imageSrc = photoUrl || `https://picsum.photos/200/200?seed=profile-${Math.floor(Math.random() * 1000)}`;

  return (
    <>
      <Header title="Edit Profile" />
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

        <form className="edit-form" onSubmit={(e) => e.preventDefault()}>
          {/* Username */}
          <div className="edit-field">
            <label className="edit-label">Username</label>
            <input
              className="edit-input"
              name="username"
              placeholder="Enter username"
              value={formData.username}
              onChange={handleInputChange}
            />
          </div>

          {/* Name */}
          <div className="edit-field">
            <label className="edit-label">Name</label>
            <input
              className="edit-input"
              name="name"
              placeholder="Display name"
              value={formData.name}
              onChange={handleInputChange}
            />
          </div>

          {/* About Me */}
          <div className="edit-field">
            <label className="edit-label">About Me:</label>
            <div className="aboutme-wrapper">
              <textarea
                className="edit-textarea"
                name="aboutMe"
                placeholder="Tell people about yourself (max 500 characters)"
                value={formData.aboutMe}
                onChange={handleInputChange}
                maxLength={500}
              />
              <div className="char-hint">
                • {formData.aboutMe.length}/500 characters
              </div>
            </div>
          </div>

          {/* Background */}
          <div className="edit-field">
            <label className="edit-label">Background</label>
            <input
              className="edit-input"
              name="background"
              placeholder="Where you're from / what shaped you"
              value={formData.background}
              onChange={handleInputChange}
            />
          </div>

          {/* Interest */}
          <div className="edit-field">
            <label className="edit-label">Interest</label>
            <input
              className="edit-input"
              name="interests"
              placeholder="Your interests"
              value={formData.interests}
              onChange={handleInputChange}
            />
          </div>

          {/* Save button */}
          <div className="save-wrapper">
            <button
              type="button"
              className="save-button"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
      <Footer />
    </>
  );
}