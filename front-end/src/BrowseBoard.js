import "./BrowseBoard.css"
import BrowseBoardList from "./BrowseBoardList";
import { useNavigate } from "react-router-dom";
import Header from "./Header";

const BrowseBoard = () => {
    const navigate = useNavigate();
    console.log("**")
    return <>
    <Header title="Browse CommYOUnity Boards" />
    {/* Back to Home button */}
    <button
        className="back-home-btn"
        onClick={() => navigate("/home")}
        style={{ marginTop: "20px" }}
      >
        ← Back
      </button>
    <div className="browse-board-content">
        <BrowseBoardList /> 
    </div>
    </>
}



export default BrowseBoard;