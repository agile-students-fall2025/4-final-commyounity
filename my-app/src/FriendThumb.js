import React from 'react'
import './FriendThumb.css'


const FriendThumb = props => {
  const imgSrc = `https://i.pravatar.cc/100?u=${props.details.id}`

  return (
    <article className="FriendThumb">
        <img alt={`${props.details.first_name} ${props.details.last_name}`} src={imgSrc} />
        <h2>{props.details.first_name} {props.details.last_name}</h2>
        <div className="username">@{props.details.username}</div>
        <button
             className="invite-button"
             onClick={() => alert(`You just invited ${props.details.first_name} (pretend)!`)}
        >
            Invite Member
        </button>
    </article>
  )
}

export default FriendThumb