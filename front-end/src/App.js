import logo from './logo.svg';
import React from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
// import './App.css';
import LoginPage from './LoginPage';
import SignUpPage from './SignUpPage';
import Home from './Home';
import ViewBoard from './ViewBoard';
import BoardDetail from "./BoardDetail";
import MembersList from './MembersList';
import EditScreen from './EditScreen'
import FriendsHomePage from "./FriendsHomePage";
import FriendsListPage from "./FriendsListPage";
import FriendRequestsPage from "./FriendRequestsPage";
import FindFriendsPage from "./FindFriendsPage";
import InviteFriendsList from './InviteFriendsList';
import FindMembers from "./FindMembers";
import ProfilePage from "./ProfilePage";
import EditProfilePage from "./EditProfilePage";
import SettingsPage from "./SettingsPage";
import NotificationSettingsPage from "./NotificationSettingsPage";
import PrivacySettingsPage from "./PrivacySettingsPage";
import DeleteProfilePage from "./DeleteProfilePage";
import CreateBoard from "./CreateBoard";
import ChangePasswordPage from "./ChangePasswordPage";
import BrowseBoard from './BrowseBoard';
import JoinBoardDetail from './JoinBoardDetail';

import Protected from './Protected'; // ⬅️ add this

function App() {
  console.log("ke", process.env.REACT_APP_KEY)
  return (
    <div className="App">
      <Router>
        <Routes>
          {/* PUBLIC ROUTES */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />

          {/* PROTECTED ROUTES */}
          <Route
            path="/home"
            element={
              <Protected>
                <Home />
              </Protected>
            }
          />
          <Route
            path="/friends"
            element={
              <Protected>
                <FriendsHomePage />
              </Protected>
            }
          />
          <Route
            path="/friends/list"
            element={
              <Protected>
                <FriendsListPage />
              </Protected>
            }
          />
          <Route
            path="/friends/requests"
            element={
              <Protected>
                <FriendRequestsPage />
              </Protected>
            }
          />
          <Route
            path="/friends/find"
            element={
              <Protected>
                <FindFriendsPage />
              </Protected>
            }
          />
          <Route
            path="/profilepage"
            element={
              <Protected>
                <ProfilePage />
              </Protected>
            }
          />
          <Route
            path="/edit-profile"
            element={
              <Protected>
                <EditProfilePage />
              </Protected>
            }
          />
          <Route
            path="/settings/change-password"
            element={
              <Protected>
                <ChangePasswordPage />
              </Protected>
            }
          />
          <Route
            path="/settings/notifications"
            element={
              <Protected>
                <NotificationSettingsPage />
              </Protected>
            }
          />
          <Route
            path="/settings/privacy"
            element={
              <Protected>
                <PrivacySettingsPage />
              </Protected>
            }
          />
          <Route
            path="/settings"
            element={
              <Protected>
                <SettingsPage />
              </Protected>
            }
          />
          <Route
            path="/delete-profile"
            element={
              <Protected>
                <DeleteProfilePage />
              </Protected>
            }
          />
          <Route
            path="/viewboards"
            element={
              <Protected>
                <ViewBoard />
              </Protected>
            }
          />
          <Route
            path="/boards/:id"
            element={
              <Protected>
                <BoardDetail />
              </Protected>
            }
          />
          <Route
            path="/joinboards/:id"
            element={
              <Protected>
                <JoinBoardDetail />
              </Protected>
            }
          />
          <Route
            path="/boards/:id/members"
            element={
              <Protected>
                <MembersList />
              </Protected>
            }
          />
          <Route
            path="/boards/:id/edit"
            element={
              <Protected>
                <EditScreen />
              </Protected>
            }
          />
          <Route
            path="/boards/:id/invite"
            element={
              <Protected>
                <InviteFriendsList />
              </Protected>
            }
          />
          <Route
            path="/boards/:id/findmembers"
            element={
              <Protected>
                <FindMembers />
              </Protected>
            }
          />
          <Route
            path="/browseboards"
            element={
              <Protected>
                <BrowseBoard />
              </Protected>
            }
          />
          <Route
            path="/createboard"
            element={
              <Protected>
                <CreateBoard />
              </Protected>
            }
          />
        </Routes>
      </Router>
    </div>
  );
}

export default App;