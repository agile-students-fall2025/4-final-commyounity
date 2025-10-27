import logo from './logo.svg';
import React from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
// import './App.css';
import ViewBoard from './ViewBoard';
import BoardDetail from "./BoardDetail";
import MembersList from './MembersList';

function App() {
  return (
    <div className="App">
      <Router>
          <Routes>

            <Route path="/viewboards" element ={<ViewBoard />} />
            <Route path="/boards/:id" element={<BoardDetail />} />
            <Route path="/boards/:id/members" element={<MembersList />} />
          </Routes>
      </Router>
    </div>
  );
}

export default App;
