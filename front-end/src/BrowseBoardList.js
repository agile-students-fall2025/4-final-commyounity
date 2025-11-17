import React, { useState, useEffect } from 'react'
import axios from 'axios'
import "./BrowseBoardList.css"
import BoardThumb from './BoardThumb'
import SearchBar from './SearchBar'

const BrowseBoardList = props => {
  const [data, setData] = useState([])
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    console.log('fetching 10 random boards...')
    axios('http://localhost:4000/api/boards')
      .then(response => {
        setData(response.data.data)
      })
      .catch(err => {
        console.error('Backend request failed:', err)
        setError('Could not load boards.')
      })
  }, [])

  // Filter boards based on search term
  const filterBoards = (boards) => {
    if (!searchTerm.trim()) return boards
    
    const lowerSearch = searchTerm.toLowerCase()
    return boards.filter(board => 
      board.title?.toLowerCase().includes(lowerSearch) ||
      board.descriptionLong?.toLowerCase().includes(lowerSearch)
    )
  }

  const suggestedBoards = data.filter(item => !item.isJoined)
  const filteredBoards = filterBoards(suggestedBoards)

  return (
    <div className="BrowseBoardList">
      <h3 style={{ 'paddingLeft': '20px' }}>Suggested Boards:</h3>
      <SearchBar 
        onSearch={setSearchTerm}
        placeholder="Search suggested boards..."
      />
      <section className="yourBoards">
        {filteredBoards.length > 0 ? (
          filteredBoards.map(item => (
            <BoardThumb key={item.id} details={item} />
          ))
        ) : (
          <p style={{ padding: '20px', color: '#999', textAlign: 'center', width: '100%' }}>
            {searchTerm ? 'No boards found matching your search.' : 'No boards available.'}
          </p>
        )}
      </section>
    </div>
  )
}

export default BrowseBoardList
