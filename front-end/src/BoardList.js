import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './BoardList.css'
import BoardThumb from './BoardThumb'
import SearchBar from './SearchBar'

const BoardList = props => {
  const [data, setData] = useState([])
  const [error, setError] = useState(null)
  const [yourBoardsSearch, setYourBoardsSearch] = useState('')
  const [notYourBoardsSearch, setNotYourBoardsSearch] = useState('')

  useEffect(() => {
    console.log('fetching boards...')
    const token = localStorage.getItem('token')

    if (!token) {
      console.error('No JWT token found in localStorage')
      setError('You must be logged in to see boards.')
      return
    }

    axios
      .get('http://localhost:4000/api/boards', {
        headers: {
          Authorization: `JWT ${token}`,  
        },
      })
      .then(response => {
        setData(response.data.data)
      })
      .catch(err => {
        console.error('Backend request failed:', err)
        setError('Could not load boards.')
      })
  }, [])

  const filterBoards = (boards, searchTerm) => {
    if (!searchTerm.trim()) return boards
    
    const lowerSearch = searchTerm.toLowerCase()
    return boards.filter(board => 
      board.title?.toLowerCase().includes(lowerSearch) ||
      board.descriptionLong?.toLowerCase().includes(lowerSearch)
    )
  }

  const yourBoards = data.filter(item => item.isOwner)
  const filteredYourBoards = filterBoards(yourBoards, yourBoardsSearch)

  const notYourBoards = data.filter(item => !item.isOwner && item.isJoined)
  const filteredNotYourBoards = filterBoards(notYourBoards, notYourBoardsSearch)

  return (
    <div className="BoardList">
  
        {/* ===== YOUR BOARDS ===== */}
        <h3>Your Boards:</h3>
  
        <div className="search-wrapper">
          <SearchBar 
            onSearch={setYourBoardsSearch}
            placeholder="Search your boards ..."
          />
        </div>
  
        <section className="board-grid">
          {filteredYourBoards.length > 0 ? (
            filteredYourBoards.map(item => (
              <div className="board-card" key={item.id || item._id}>
                <BoardThumb details={item} />
              </div>
            ))
          ) : (
            <p className="empty-msg">
              {yourBoardsSearch
                ? 'No boards found matching your search.'
                : 'No boards available.'}
            </p>
          )}
        </section>
  
        {/* ===== MEMBER BOARDS ===== */}
        <h3>Boards You Are a Member Of:</h3>
  
        <div className="search-wrapper">
          <SearchBar 
            onSearch={setNotYourBoardsSearch}
            placeholder="Search member boards..."
          />
        </div>
  
        <section className="board-grid">
          {filteredNotYourBoards.length > 0 ? (
            filteredNotYourBoards.map(item => (
              <div className="board-card" key={item.id || item._id}>
                <BoardThumb details={item} />
              </div>
            ))
          ) : (
            <p className="empty-msg">
              {notYourBoardsSearch
                ? 'No boards found matching your search.'
                : 'No boards available.'}
            </p>
          )}
        </section>
  
    </div>
  )
  
}

export default BoardList