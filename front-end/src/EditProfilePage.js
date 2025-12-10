import React, { useState, useEffect, useCallback } from "react";
import "./EditProfilePage.css";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import Cropper from "react-easy-crop";
import API_BASE from "./utils/apiBase";

// Helper function to create cropped image
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.crossOrigin = "anonymous";
    image.src = url;
  });

async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, "image/jpeg", 0.9);
  });
}

export default function EditProfilePage() {
  const navigate = useNavigate();
  const [photoUrl, setPhotoUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Cropper states
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

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
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/profile`, {
        method: "GET",
        headers: {
          "Authorization": `JWT ${token}`,
        },
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

  // When user selects a file, show the cropper
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result);
      setShowCropper(true);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // When user confirms the crop
  const handleCropConfirm = async () => {
    try {
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      
      // Show preview
      const previewUrl = URL.createObjectURL(croppedBlob);
      setPhotoUrl(previewUrl);
      setShowCropper(false);
      setImageToCrop(null);

      // Upload to backend
      const formDataUpload = new FormData();
      formDataUpload.append('profilePhoto', croppedBlob, 'profile.jpg');

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/profile/photo`, {
        method: "POST",
        headers: {
          "Authorization": `JWT ${token}`,
        },
        body: formDataUpload
      });

      const data = await response.json();

      if (response.ok) {
        setPhotoUrl(data.photoUrl);
        alert("Profile photo uploaded successfully!");
      } else {
        alert(data.error || "Failed to upload photo");
      }
    } catch (err) {
      console.error("Error cropping/uploading photo:", err);
      alert("Failed to upload photo. Please try again.");
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setImageToCrop(null);
  };

  const handleSave = async () => {
    if (formData.aboutMe.length > 500) {
      alert("About Me cannot exceed 500 characters");
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/profile`, {
        method: "PUT",
        headers: {
          "Authorization": `JWT ${token}`,
          "Content-Type": "application/json",
        },
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
      <div className="EditProfilePage">

        {/* Image Cropper Modal */}
        {showCropper && (
          <div className="cropper-modal">
            <div className="cropper-container">
              <div className="cropper-header">
                <h3>Adjust Your Photo</h3>
                <p>Drag to reposition, scroll to zoom</p>
              </div>
              <div className="cropper-area">
                <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>
              <div className="cropper-controls">
                <label>Zoom</label>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="zoom-slider"
                />
              </div>
              <div className="cropper-buttons">
                <button onClick={handleCropCancel} className="cancel-btn">
                  Cancel
                </button>
                <button onClick={handleCropConfirm} className="confirm-btn">
                  Save Photo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Picture block */}
        <div className="edit-photo-section">
          <div className="profile-photo-uploader">
            <img
              src={imageSrc}
              alt="Profile"
              className="profile-photo"
            />

            <label htmlFor="profile-photo-input" className="upload-photo-btn">
              Upload Profile Photo
            </label>
            <input
              id="profile-photo-input"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
          </div>
        </div>

        {/* Form fields */}
        <div className="edit-form">
          <div className="edit-field">
            <label className="edit-label">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="edit-input"
              placeholder="Enter username"
            />
          </div>

          <div className="edit-field">
            <label className="edit-label">Display Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="edit-input"
              placeholder="Enter your name"
            />
          </div>

          <div className="edit-field">
            <label className="edit-label">About Me</label>
            <textarea
              name="aboutMe"
              value={formData.aboutMe}
              onChange={handleInputChange}
              className="edit-textarea"
              placeholder="Tell us about yourself..."
              rows={4}
              maxLength={500}
            />
            <span className="char-count">{formData.aboutMe.length}/500</span>
          </div>

          <div className="edit-field">
            <label className="edit-label">Background</label>
            <input
              type="text"
              name="background"
              value={formData.background}
              onChange={handleInputChange}
              className="edit-input"
              placeholder="Your background..."
            />
          </div>

          <div className="edit-field">
            <label className="edit-label">Interests</label>
            <input
              type="text"
              name="interests"
              value={formData.interests}
              onChange={handleInputChange}
              className="edit-input"
              placeholder="Your interests..."
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="save-profile-btn"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
}
