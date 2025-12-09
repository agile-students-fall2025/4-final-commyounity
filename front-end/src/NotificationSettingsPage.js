import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import "./NotificationSettingsPage.css";
import Header from "./Header";

export default function NotificationSettingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Local toggle states for each notification type
  const [boardUpdatesOn, setBoardUpdatesOn] = useState(true);
  const [messagesOn, setMessagesOn] = useState(true);
  const [followersOn, setFollowersOn] = useState(true);

  // Load notification settings when component mounts
  useEffect(() => {
    console.log('[NotificationSettings] Component mounted, fetching settings...');
    fetchNotificationSettings();
  }, []); // Only run once on mount

  const fetchNotificationSettings = async () => {
    try {
      console.log('[NotificationSettings] Fetching from backend...');
      const token = localStorage.getItem('token');
      const response = await fetch("http://178.128.70.142:4000/api/profile", {
        method: "GET",
        headers: {
          "Authorization": `JWT ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[NotificationSettings] Received data:', data);
        
        if (data.notifications) {
          const newBoardUpdates = data.notifications.boardUpdates !== false;
          const newMessages = data.notifications.newMessages !== false;
          const newFollowers = data.notifications.newFollower !== false;
          
          console.log('[NotificationSettings] Setting states:', {
            boardUpdates: newBoardUpdates,
            messages: newMessages,
            followers: newFollowers
          });
          
          setBoardUpdatesOn(newBoardUpdates);
          setMessagesOn(newMessages);
          setFollowersOn(newFollowers);
        }
      } else {
        console.error('[NotificationSettings] Failed to fetch:', response.status);
      }
    } catch (err) {
      console.error('[NotificationSettings] Error fetching notification settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveNotificationSettings = async (newSettings) => {
    try {
      console.log('[NotificationSettings] Saving settings:', newSettings);
      
      const token = localStorage.getItem('token');
      
      const response = await fetch("http://178.128.70.142:4000/api/profile/notifications", {
        method: "PUT",
        headers: {
          "Authorization": `JWT ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSettings)
      });

      const data = await response.json();
      console.log('[NotificationSettings] Save response:', data);

      if (!response.ok) {
        console.error('[NotificationSettings] Failed to save:', data.error);
        alert(data.error || "Failed to save settings");
      } else {
        console.log('[NotificationSettings] Settings saved successfully');
      }
    } catch (err) {
      console.error('[NotificationSettings] Error saving notification settings:', err);
      alert("Failed to save settings. Please try again.");
    }
  };

  const toggleBoardUpdates = () => {
    const newValue = !boardUpdatesOn;
    console.log('[NotificationSettings] Toggling Board Updates:', boardUpdatesOn, '->', newValue);
    setBoardUpdatesOn(newValue);
    saveNotificationSettings({
      boardUpdates: newValue,
      newMessages: messagesOn,
      newFollower: followersOn
    });
  };

  const toggleMessages = () => {
    const newValue = !messagesOn;
    console.log('[NotificationSettings] Toggling Messages:', messagesOn, '->', newValue);
    setMessagesOn(newValue);
    saveNotificationSettings({
      boardUpdates: boardUpdatesOn,
      newMessages: newValue,
      newFollower: followersOn
    });
  };

  const toggleFollowers = () => {
    const newValue = !followersOn;
    console.log('[NotificationSettings] Toggling Followers:', followersOn, '->', newValue);
    setFollowersOn(newValue);
    saveNotificationSettings({
      boardUpdates: boardUpdatesOn,
      newMessages: messagesOn,
      newFollower: newValue
    });
  };

  if (loading) {
    return (
      <>
        <Header title="Notifications Settings" />
        <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>
      </>
    );
  }

  return (
    <>
      <Header title="Notifications Settings" />
      <div className="NotifPage">
        {/* Row: Board Updates */}
        <div className="notif-row">
          <div className="notif-label">Board Updates</div>
          <button
            className={`notif-toggle ${boardUpdatesOn ? '' : 'off'}`}
            onClick={toggleBoardUpdates}
          >
            {boardUpdatesOn ? "On" : "Off"}
          </button>
        </div>

        {/* Row: New Messages */}
        <div className="notif-row">
          <div className="notif-label">New Messages</div>
          <button
            className={`notif-toggle ${messagesOn ? '' : 'off'}`}
            onClick={toggleMessages}
          >
            {messagesOn ? "On" : "Off"}
          </button>
        </div>

        {/* Row: New Follower */}
        <div className="notif-row">
          <div className="notif-label">New Follower</div>
          <button
            className={`notif-toggle ${followersOn ? '' : 'off'}`}
            onClick={toggleFollowers}
          >
            {followersOn ? "On" : "Off"}
          </button>
        </div>
      </div>
    </>
  );
}