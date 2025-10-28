import logo from './logo.svg';
import React from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
// import './App.css';
import ViewBoard from './ViewBoard';
import BoardDetail from "./BoardDetail";
import MembersList from './MembersList';
import EditScreen from './EditScreen'
import InviteFriendsList from './InviteFriendsList';
import FindMembers from "./FindMembers";
import ProfilePage from "./ProfilePage";

function App() {
  return (
    <div className="App">
      <Router>
          <Routes>
             <Route path="/profilepage" element={<ProfilePage />} />
            <Route path="/viewboards" element ={<ViewBoard />} />
            <Route path="/boards/:id" element={<BoardDetail />} />
            <Route path="/boards/:id/members" element={<MembersList />} />
            <Route path="/boards/:id/edit" element={<EditScreen />} />
            <Route path="/boards/:id/invite" element={<InviteFriendsList />} />
            <Route path="/boards/:id/findmembers" element={<FindMembers />} />
            
          </Routes>
      </Router>
    </div>
  );
}

export default App;