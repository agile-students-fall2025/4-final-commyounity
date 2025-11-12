import React, { useState, useEffect } from "react";
import "./ProfilePage.css";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user profile data when component mounts or when navigating back
  useEffect(() => {
    fetchProfile();
  }, []); // Empty dependency means it runs on mount
  
  // Also refresh when the page becomes visible again
  useEffect(() => {
    const handleFocus = () => {
      fetchProfile();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/profile", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else {
        setError("Failed to load profile");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

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
      return;
    }

    try {
      const response = await fetch("http://localhost:4000/api/profile", {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        alert("Profile deleted successfully. You will now be logged out.");
        navigate("/");
      } else {
        alert(data.error || "Failed to delete profile. Please try again.");
      }
    } catch (err) {
      console.error("Error deleting profile:", err);
      alert("Something went wrong. Please try again.");
    }
  };

  // Show loading state
  if (loading) {
    return (
      <>
        <Header title="Your Profile" />
        <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>
        <Footer />
      </>
    );
  }

  // Show error state
  if (error) {
    return (
      <>
        <Header title="Your Profile" />
        <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>
          {error}
        </div>
        <Footer />
      </>
    );
  }

  const randomImage = profile?.profilePhoto || `https://picsum.photos/160/120?random=${Math.floor(Math.random() * 1000)}`;

  // Helper function to safely display name
  const getDisplayName = (name) => {
    if (!name) return "User Name";
    if (typeof name === 'string') return name;
    if (typeof name === 'object') {
      // Handle Google OAuth name object
      return `${name.givenName || ''} ${name.familyName || ''}`.trim() || "User Name";
    }
    return "User Name";
  };

  const displayName = getDisplayName(profile?.name);

  return (
    <>
      <Header title="Your Profile" />
      <Link to="/home" className="back-btn">
        ← Back
      </Link>
      <div className="ProfilePage">
        {/* User top card: name/handle + profile picture area */}
        <section className="profile-top-card">
          {/* User info block on the left */}
          <div className="user-basic">
            <div className="user-name">{displayName}</div>
            <div className="user-handle">@{profile?.username || "username"}</div>
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
              onClick={() => navigate("/edit-profile")}
            >
              Edit Profile
            </button>
          </div>
        </section>

        {/* About Me section */}
        <section className="profile-section">
          <div className="section-label">About Me:</div>
          <div className="section-box multiline-box">
            {profile?.aboutMe || "No information provided"}
          </div>
        </section>

        {/* Background section */}
        <section className="profile-section">
          <div className="section-label">Background</div>
          <input
            className="section-input"
            value={profile?.background || ""}
            readOnly
          />
        </section>

        {/* Interests section */}
        <section className="profile-section">
          <div className="section-label">Interests</div>
          <input
            className="section-input"
            value={profile?.interests || ""}
            readOnly
          />
        </section>

        {/* Buttons */}
        <section className="profile-action-area">
          <button
            className="wide-button settings-btn"
            onClick={() => navigate("/settings")}
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
