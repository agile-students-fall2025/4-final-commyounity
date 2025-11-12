import React, { useState, useEffect } from 'react'
import axios from 'axios'
// import logo from './logo.svg';
import './BoardList.css'
import BoardThumb from './BoardThumb'


const BoardList = props => {
  // start a state varaible with a blank array
  const [data, setData] = useState([])
  const [error, setError] = useState(null)
  // the following side-effect will be called once upon initial render
  useEffect(() => {
    // fetch some mock data about animals for sale
    console.log('fetching 10 random boards...')
    axios('http://localhost:4000/api/boards')
      .then(response => {
        // extract the data from the server response
        setData(response.data.data)
      })
      .catch(err => {
        console.error('Backend request failed:', err)
        setError('Could not load boards.')
      })
  }, []) // only run it once!


  return (
    <div className="BoardList">
      <h3 style = {{ 'paddingLeft' : '20px'}}>Your Boards:</h3>
      <section className="yourBoards">
        {data
             .filter(item => item.isOwner)        
             .map(item => (                      
              <BoardThumb key={item.id} details={item} />
            ))
        }
      </section>
      <h3 style = {{ 'paddingLeft' : '20px'}}>Boards Your Are a Member Of:</h3>
      <section className="NotYourBoards">
        {data
             .filter(item => !item.isOwner && item.isJoined)        
             .map(item => (                      
              <BoardThumb key={item.id} details={item} />
            ))
        }
      </section>
    </div>
  )
}

export default BoardList
