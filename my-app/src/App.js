import logo from './logo.svg';
import React from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
// import './App.css';
import ViewBoard from './ViewBoard';
import BoardDetail from "./BoardDetail";

function App() {
  return (
    <div className="App">
      <Router>
          <Routes>

            {/*Carina added a route to see content about me*/}
            <Route path="/viewboards" element ={<ViewBoard />} />
            <Route path="/boards/:id" element={<BoardDetail />} />

          </Routes>
      </Router>
    </div>
  );
}

export default App;
