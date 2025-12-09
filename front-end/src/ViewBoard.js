
import "./ViewBoard.css"
import BoardList from "./BoardList";
import { Link } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";


const ViewBoard = () => {
    console.log("**")
    return <>
     <Header title="View Your CommYOUnity Boards" />
    {/* Back to Home button */}
    <div className="view-board-content">
        <BoardList /> 
    </div>
    <Footer backToHome/> 
    </>
}


export default ViewBoard;