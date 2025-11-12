import "./BrowseBoard.css"
import BrowseBoardList from "./BrowseBoardList";
import { Link } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

const BrowseBoard = () => {
    console.log("**")
    return <>
    <Header title="Browse CommYOUnity Boards" />
    {/* Back to Home button */}
    <Link to="/home" className="back-btn">
          ← Back
    </Link>
    <div className="browse-board-content">
        <BrowseBoardList /> 
    </div>
    <Footer />
    </>
}



export default BrowseBoard;