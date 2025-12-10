import "./BrowseBoard.css"
import BrowseBoardList from "./BrowseBoardList";
import { Link } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

const BrowseBoard = () => {
    console.log("**")
    return <>
    <></>
    <Header title="Browse CommYOUnity Boards" />
    <div className="browse-board-content">
        <BrowseBoardList /> 
    </div>
    <Footer backToHome />
    </>
}



export default BrowseBoard;