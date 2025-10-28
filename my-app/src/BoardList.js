import React, { useState, useEffect } from 'react'
import axios from 'axios'
// import logo from './logo.svg';
import './BoardList.css'
import BoardThumb from './BoardThumb'


const BoardList = props => {
  // start a state varaible with a blank array
  const [data, setData] = useState([])

  // the following side-effect will be called once upon initial render
  useEffect(() => {
    // fetch some mock data about animals for sale
    console.log('fetching 10 random boards...')
    axios(axios(`https://my.api.mockaroo.com/mock_boards_data.json?key=${process.env.REACT_APP_MOCKAROO_KEY}`))
      .then(response => {
        // extract the data from the server response
        setData(response.data)
      })
      .catch(err => {
        // Mockaroo, which we're using for our Mock API, only allows 200 requests per day on the free plan
        console.log(`Sorry, buster.  No more requests allowed today!`)
        console.error(err) // the server returned an error... probably too many requests... until we pay!

        // make some backup fake data
        const backupData = [
          {
            id: 1,
            title: 'Your Cool Boards',
            isOwner: true,
            memberCount: 10,
            coverPhotoURL: 'http://dummyimage.com/236x100.png/cc0000/ffffff',
            descriptionShort:
              'purus eu magna vulputate luctus cum sociis natoque penatibus et magnis',
            descriptionLong:
                'non velit nec nisi vulputate nonummy maecenas tincidunt lacus at velit vivamus vel nulla eget eros elementum pellentesque quisque porta volutpat erat quisque erat eros viverra eget congue eget semper rutrum nulla nunc purus phasellus in felis donec semper sapien a libero nam dui proin leo odio porttitor id consequat in consequat ut nulla sed accumsan felis ut at dolor quis odio consequat varius integer ac leo pellentesque ultrices mattis odio donec vitae nisi nam ultrices libero'
          },
          {
            id: 2,
            title: 'Not Your Cool Boards',
            isOwner: false,
            memberCount: 10,
            coverPhotoURL: 'http://dummyimage.com/236x100.png/cc0000/ffffff',
            descriptionShort:
              'purus eu magna vulputate luctus cum sociis natoque penatibus et magnis',
            descriptionLong:
                'non velit nec nisi vulputate nonummy maecenas tincidunt lacus at velit vivamus vel nulla eget eros elementum pellentesque quisque porta volutpat erat quisque erat eros viverra eget congue eget semper rutrum nulla nunc purus phasellus in felis donec semper sapien a libero nam dui proin leo odio porttitor id consequat in consequat ut nulla sed accumsan felis ut at dolor quis odio consequat varius integer ac leo pellentesque ultrices mattis odio donec vitae nisi nam ultrices libero'
          },
        ]

        setData(backupData)
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
             .filter(item => !item.isOwner)        
             .map(item => (                      
              <BoardThumb key={item.id} details={item} />
            ))
        }
      </section>
    </div>
  )
}

export default BoardList
