import logo from './logo.svg';
import React from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
// import './App.css';
import ViewBoard from './ViewBoard';
import BoardDetail from "./BoardDetail";
import MembersList from './MembersList';
import EditScreen from './EditScreen'
import FriendsHomePage from "./FriendsHomePage";
import FriendsListPage from "./FriendsListPage";
import FriendRequestsPage from "./FriendRequestsPage";
import FindFriendsPage from "./FindFriendsPage";

function App() {
  return (
    <div className="App">
      <Router>
          <Routes>
            <Route path="/friends" element={<FriendsHomePage />} />
            <Route path="/friends/list" element={<FriendsListPage />} />
            <Route path="/friends/requests" element={<FriendRequestsPage />} />
            <Route path="/friends/find" element={<FindFriendsPage />} />
            <Route path="/viewboards" element ={<ViewBoard />} />
            <Route path="/boards/:id" element={<BoardDetail />} />
            <Route path="/boards/:id/members" element={<MembersList />} />
            <Route path="/boards/:id/edit" element={<EditScreen />} />
            
          </Routes>
      </Router>
    </div>
  );
}

export default App;
