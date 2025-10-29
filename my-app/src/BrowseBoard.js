import Logo from "./logo.svg"
import "./ViewBoard.css"
import BrowseBoardList from "./BrowseBoardList";

const BrowseBoard = () => {
    console.log("**")
    return <>
    <Logotext/>
    <div className="browse-board-content">
        <BrowseBoardList /> 
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
        Browse CommYOUnity Boards
    </div>
    </div>
    </>
}



export default BrowseBoard;