import React, { useState, useEffect } from 'react'
import axios from 'axios'
import "./BrowseBoardList.css"
import BoardThumb from './BoardThumb'
import SearchBar from './SearchBar'
import API_BASE from "./utils/apiBase";

const BrowseBoardList = () => {
  const [data, setData] = useState([])
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    console.log('fetching suggested boards...')
    const token = localStorage.getItem('token')

    if (!token) {
      console.error('No JWT token found in localStorage')
      setError('You must be logged in to browse boards.')
      return
    }

    axios.get(`${API_BASE}/api/browse/boards`, {
      headers: {
        Authorization: `JWT ${token}`,
      },
    })
    .then(response => {
      setData(response.data.data)
    })
    .catch(err => {
      console.error('Backend request failed:', err)
      setError('Could not load suggested boards.')
    })
  }, [])

  const filterBoards = (boards) => {
    if (!searchTerm.trim()) return boards
    
    const lowerSearch = searchTerm.toLowerCase()
    return boards.filter(board => 
      board.title?.toLowerCase().includes(lowerSearch) ||
      board.descriptionLong?.toLowerCase().includes(lowerSearch)
    )
  }

  const filteredBoards = filterBoards(data)

  if (error) {
    return (
      <div className="BrowseBoardList">
        <p style={{ padding: '20px', color: '#c00', textAlign: 'center' }}>
          {error}
        </p>
      </div>
    )
  }

  return (
    <div className="BrowseBoardList">
      <h3 style={{ paddingLeft: '20px' }}>Suggested Boards:</h3>
      <SearchBar 
        onSearch={setSearchTerm}
        placeholder="Search suggested boards..."
      />
      <section className="yourBoards">
        {filteredBoards.length > 0 ? (
          filteredBoards.map(item => (
            <BoardThumb key={item.id || item._id} details={item} />
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
