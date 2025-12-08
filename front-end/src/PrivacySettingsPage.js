import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import "./PrivacySettingsPage.css";
import Header from "./Header";

export default function PrivacySettingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // State variables for each setting
  const [visibility, setVisibility] = useState("Private");
  const [canMessage, setCanMessage] = useState("Everyone");
  const [onlineStatusOn, setOnlineStatusOn] = useState(true);

  // Load privacy settings when component mounts
  useEffect(() => {
    console.log('[PrivacySettings] Component mounted, fetching settings...');
    fetchPrivacySettings();
  }, []); // Only run once on mount

  const fetchPrivacySettings = async () => {
    try {
      console.log('[PrivacySettings] Fetching from backend...');
      const token = localStorage.getItem('token');
      const response = await fetch("http://localhost:4000/api/profile", {
        method: "GET",
        headers: {
          "Authorization": `JWT ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[PrivacySettings] Received data:', data);
        
        if (data.privacy) {
          const newVisibility = data.privacy.visibility || "Private";
          const newCanMessage = data.privacy.canMessage || "Everyone";
          const newOnlineStatus = data.privacy.onlineStatus !== false;
          
          console.log('[PrivacySettings] Setting states:', {
            visibility: newVisibility,
            canMessage: newCanMessage,
            onlineStatus: newOnlineStatus
          });
          
          setVisibility(newVisibility);
          setCanMessage(newCanMessage);
          setOnlineStatusOn(newOnlineStatus);
        }
      } else {
        console.error('[PrivacySettings] Failed to fetch:', response.status);
      }
    } catch (err) {
      console.error('[PrivacySettings] Error fetching privacy settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const savePrivacySettings = async (newSettings) => {
    try {
      console.log('[PrivacySettings] Saving settings:', newSettings);
      
      const token = localStorage.getItem('token');
      const response = await fetch("http://localhost:4000/api/profile/privacy", {
        method: "PUT",
        headers: {
          "Authorization": `JWT ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSettings)
      });

      const data = await response.json();
      console.log('[PrivacySettings] Save response:', data);

      if (!response.ok) {
        console.error('[PrivacySettings] Failed to save:', data.error);
        alert(data.error || "Failed to save settings");
      } else {
        console.log('[PrivacySettings] Settings saved successfully');
      }
    } catch (err) {
      console.error('[PrivacySettings] Error saving privacy settings:', err);
      alert("Failed to save settings. Please try again.");
    }
  };

  // Handlers:
  const toggleVisibility = () => {
    const newVisibility = visibility === "Private" ? "Public" : "Private";
    console.log('[PrivacySettings] Toggling Visibility:', visibility, '->', newVisibility);
    setVisibility(newVisibility);
    savePrivacySettings({
      visibility: newVisibility,
      canMessage,
      onlineStatus: onlineStatusOn
    });
  };

  const toggleCanMessage = () => {
    const newCanMessage = canMessage === "Everyone" ? "Friends Only" : "Everyone";
    console.log('[PrivacySettings] Toggling Can Message:', canMessage, '->', newCanMessage);
    setCanMessage(newCanMessage);
    savePrivacySettings({
      visibility,
      canMessage: newCanMessage,
      onlineStatus: onlineStatusOn
    });
  };

  const toggleOnlineStatus = () => {
    const newOnlineStatus = !onlineStatusOn;
    console.log('[PrivacySettings] Toggling Online Status:', onlineStatusOn, '->', newOnlineStatus);
    setOnlineStatusOn(newOnlineStatus);
    savePrivacySettings({
      visibility,
      canMessage,
      onlineStatus: newOnlineStatus
    });
  };

  if (loading) {
    return (
      <>
        <Header title="Privacy Settings" />
        <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>
      </>
    );
  }

  return (
    <>
      <Header title="Privacy Settings" />
      <div className="PrivacyPage">
        {/* Row: Profile Visibility */}
        <div className="privacy-row">
          <div className="privacy-label">Profile Visibility</div>
          <button 
            className={`privacy-toggle ${visibility === "Private" ? "private" : "public"}`}
            onClick={toggleVisibility}
          >
            {visibility}
          </button>
        </div>

        {/* Row: Who Can Message Me */}
        <div className="privacy-row">
          <div className="privacy-label">Who Can Message Me</div>
          <button 
            className={`privacy-toggle ${canMessage === "Everyone" ? "everyone" : "friends-only"}`}
            onClick={toggleCanMessage}
          >
            {canMessage}
          </button>
        </div>

        {/* Row: Online Status */}
        <div className="privacy-row">
          <div className="privacy-label">Online Status</div>
          <button 
            className={`privacy-toggle ${onlineStatusOn ? "on" : "off"}`}
            onClick={toggleOnlineStatus}
          >
            {onlineStatusOn ? "On" : "Off"}
          </button>
        </div>
      </div>
    </>
  );
}