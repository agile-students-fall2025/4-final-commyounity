import React from 'react'
import { Link } from 'react-router-dom'
import './BoardThumb.css'


const BoardThumb = ({ details }) => {
 
  const linkPath =
  details.isOwner || details.isJoined
    ? `/boards/${details.id}`    
    : `/joinboards/${details.id}`


  return (
    
    <article className="BoardThumb">
      <Link to={linkPath}>
        <img alt={details.title} src={details.coverPhotoURL} />
        <h2>{details.title}</h2>
      </Link>
    </article>
  )
}

export default BoardThumb
