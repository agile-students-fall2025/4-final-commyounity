
import "./ViewBoard.css"
import BoardList from "./BoardList";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";


const ViewBoard = () => {
    const navigate = useNavigate();
    console.log("**")
    return <>
     <Header title="View Your CommYOUnity Boards" />
    {/* Back to Home button */}
    <button
        className="back-home-btn"
        onClick={() => navigate("/home")}
        style={{ marginTop: "20px" }}
      >
        ← Back
      </button>
    <div className="view-board-content">
        <BoardList /> 
    </div>
    <Footer /> 
    </>
}


export default ViewBoard;