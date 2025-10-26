import Logo from "./logo.svg"
import "./ViewBoard.css"
import BoardList from "./BoardList";

const ViewBoard = () => {
    console.log("**")
    return <>
    <Logotext/>
    <div className="view-board-content">
        <BoardList /> 
    </div>
    </>
}

const Logotext = () => {
    return <>
    <div className = "Logotext" >
    <div className = "textLogoText">
    <img
    src= {Logo}
    alt="logo"
    height="200"
    width="300" />
    </div>
    <div className = "textLogoText" style = {{'borderLeft': '3px solid black', 'paddingLeft' : '40px'}}>
        View Your CommYOUnity Boards
    </div>
    </div>
    </>
}



export default ViewBoard;