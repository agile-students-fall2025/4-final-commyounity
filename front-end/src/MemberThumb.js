import React from 'react'
import './MemberThumb.css'


const MemberThumb = props => {
  const imgSrc = props.details.avatar || `https://i.pravatar.cc/100?u=${props.details.id}`

  return (
    <article className="MemberThumb">
        <img alt={`${props.details.first_name} ${props.details.last_name}`} src={imgSrc} />
        <h2>{props.details.first_name} {props.details.last_name}</h2>
        <div className="username">@{props.details.username}</div>
        <div className="country">From: {props.details.country}</div>
        <p className="description">Interests: {props.details.description}</p>
        {props.canKick && (
        <button
             className="kick-button"
             onClick={() => alert(`You just kicked ${props.details.first_name} (pretend)!`)}
        >
            Kick Member
        </button>
        )}
    </article>
  )
}

export default MemberThumb