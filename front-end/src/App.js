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





import BrowseBoard from './BrowseBoard';
import JoinBoardDetail from './JoinBoardDetail';

function App() {
  return (
    <div className="App">
      <Router>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/home" element={<Home />} />
            <Route path="/friends" element={<FriendsHomePage />} />
            <Route path="/friends/list" element={<FriendsListPage />} />
            <Route path="/friends/requests" element={<FriendRequestsPage />} />
            <Route path="/friends/find" element={<FindFriendsPage />} />
            <Route path="/profilepage" element={<ProfilePage />} />
            <Route path="/edit-profile" element={<EditProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/notifications" element={<NotificationSettingsPage />} />
            <Route path="/settings/privacy" element={<PrivacySettingsPage />} />
            <Route path="/delete-profile" element={<DeleteProfilePage />} />
            <Route path="/viewboards" element={<ViewBoard />} />
            <Route path="/boards/:id" element={<BoardDetail />} />
            <Route path="/joinboards/:id" element={<JoinBoardDetail />} />
            <Route path="/boards/:id/members" element={<MembersList />} />
            <Route path="/boards/:id/edit" element={<EditScreen />} />
            <Route path="/boards/:id/invite" element={<InviteFriendsList />} />
            <Route path="/boards/:id/findmembers" element={<FindMembers />} />
            <Route path="/browseboards" element ={<BrowseBoard />} />
            <Route path="/createboard" element={<CreateBoard />} />


    
            
          </Routes>
      </Router>
    </div>
  );
}

export default App;