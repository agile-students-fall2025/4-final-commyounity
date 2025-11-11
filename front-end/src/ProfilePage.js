import React from "react";
import "./ProfilePage.css";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

export default function ProfilePage() {
  // This component is the Profile Page feature.
  // It matches the wireframe:
  // - Back button + logo + "Login"
  // - User info (name, handle, profile picture + Edit Profile button)
  // - About Me / Background / Interests fields
  // - Settings + Delete Profile buttons
  const navigate = useNavigate();
  const randomImage = `https://picsum.photos/160/120?random=${Math.floor(Math.random() * 1000)}`;
  const handleLogout = async () => {
    try {
      await fetch("http://localhost:4000/logout", {
        method: "GET",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      navigate("/"); 
    }
  };

  const handleDeleteProfile = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your profile?\n\nThis action cannot be undone."
    );

    if (!confirmed) {
      alert("Profile deletion canceled.");
      return;
    }

    try {
      alert("Profile deleted successfully. You will now be logged out.");
      await handleLogout();
    } catch (err) {
      console.error("Error deleting profile:", err);
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <>
    <Header title="Your Profile" />
    <Link to="/home" className="back-btn">
          ← Back
    </Link>
    <div className="ProfilePage">
      {/* ===== User top card: name/handle + profile picture area ===== */}
      <section className="profile-top-card">
        {/* User info block on the left */}
        <div className="user-basic">
          <div className="user-name">Bill Williams</div>
          <div className="user-handle">@username</div>
        </div>

        {/* Profile picture and "Edit Profile" button on the right */}
        <div className="user-photo-block">
          <img
            src={randomImage}
            alt="Profile"
            className="photo-placeholder"
          />
          <button
            className="edit-profile-btn"
            onClick={() => {
              alert("Editing profile not yet connected to backend. Pretend it worked!");
              navigate("/edit-profile");
            }}
          >
            Edit Profile
          </button>
        </div>
      </section>

      {/* ===== About Me section ===== */}
      <section className="profile-section">
        <div className="section-label">About Me:</div>
        <div className="section-box multiline-box">
          Hi! I'm Bill from Hong Kong. I love connecting with people who
          enjoy exploring different cuisines and cultures!
        </div>
      </section>

      {/* ===== Background section ===== */}
      <section className="profile-section">
        <div className="section-label">Background</div>
        <input
          className="section-input"
          defaultValue="Grew up in USA, born in Hong Kong"
          // Future: make this controlled so user can edit and save.
        />
      </section>

      {/* ===== Interests section ===== */}
      <section className="profile-section">
        <div className="section-label">Interests</div>
        <input
          className="section-input"
          defaultValue="Hiking, Skiing, Reading"
        />
      </section>

      {/* ===== Buttons ===== */}
      <section className="profile-action-area">
        <button
          className="wide-button settings-btn"
          onClick={() => {
            alert("Opening settings (pretend)!");
            navigate("/settings");
          }}
        >
          Settings
        </button>

        <button
            className="wide-button delete-btn"
            onClick={handleDeleteProfile}
          >
            Delete Profile
          </button>
        </section>
    </div>
    <Footer />
    </>
  );
}
