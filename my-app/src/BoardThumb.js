import React from 'react'
import { Link } from 'react-router-dom'
import './BoardThumb.css'

const BoardThumb = props => {
  // console.log(props);

  // inject a random placeholder image from the Lorem Picsum API
  // the mockaroo API we're using doesn't include this
  // ultimately, this data would come from the API
  const imgSrc = `https://picsum.photos/200?id=${props.details.id}` // tack on this animal's id to the query

  return (
    <article className="BoardThumb">
      <Link to={`/boards/${props.details.id}`}>
        <img alt={props.details.title} src={imgSrc} />
        <h2>{props.details.title}</h2>
      </Link>
    </article>
  )
}

// make this function available to be imported into another module
export default BoardThumb
