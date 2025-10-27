import React from 'react'
import { Link } from 'react-router-dom'
import './MemberThumb.css'

const MemberThumb = props => {
  // inject a random placeholder image if avatar missing
  const imgSrc = props.details.avatar || `https://i.pravatar.cc/100?u=${props.details.id}`

  return (
    <article className="MemberThumb">
      <Link to={`/members/${props.details.id}`}>
        <img alt={`${props.details.first_name} ${props.details.last_name}`} src={imgSrc} /> </Link>
        <h2>{props.details.first_name} {props.details.last_name}</h2>
        <div className="username">@{props.details.username}</div>
        <div className="country">From: {props.details.country}</div>
        <p className="description">Interests: {props.details.description}</p>
    </article>
  )
}

export default MemberThumb