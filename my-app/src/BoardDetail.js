// import React, { useState, useEffect } from 'react'
// import { useParams } from 'react-router-dom'
// import axios from 'axios'
// import './BoardDetail.css'

// const BoardDetail = props => {
//   // start a state varaible with a blank array
//   const [data, setData] = useState([])

//   // get the id of the animal this component is rendering... the useParams function will grab it from the URL
//   const boardId = useParams()

//   // the following side-effect will only be called once on initial render
//   useEffect(() => {
//     // fetch some mock data about animals for sale
//     // the id of the animal that was clicked on is passed as a part of the match field of the props
//     console.log(`fetching animal id=${boardId}...`)
//     axios('https://my.api.mockaroo.com/mock_boards_data.json?key=dc8ece40')
//       .then(response => {
//         // extract the data from the server response
//         setData(response.data)
//       })
//       .catch(err => {
//         // Mockaroo, which we're using for our Mock API, only allows 200 requests per day on the free plan
//         console.log(`Sorry, buster.  No more requests allowed today!`)
//         console.error(err) // the server returned an error... probably too many requests... until we pay!

//         // make some backup fake data
//         const backupData = [
//           {
//             id: 1,
//             title: 'Your Cool Boards',
//             isOwner: true,
//             memberCount: 10,
//             coverPhotoURL: 'http://dummyimage.com/236x100.png/cc0000/ffffff',
//             descriptionShort:
//               'purus eu magna vulputate luctus cum sociis natoque penatibus et magnis',
//             descriptionLong:
//                 'non velit nec nisi vulputate nonummy maecenas tincidunt lacus at velit vivamus vel nulla eget eros elementum pellentesque quisque porta volutpat erat quisque erat eros viverra eget congue eget semper rutrum nulla nunc purus phasellus in felis donec semper sapien a libero nam dui proin leo odio porttitor id consequat in consequat ut nulla sed accumsan felis ut at dolor quis odio consequat varius integer ac leo pellentesque ultrices mattis odio donec vitae nisi nam ultrices libero'
//           },
//         ]

//         setData(backupData[0])
//       })
//   }, [boardId])

// //   const handleBuyButtonClick = e => {
// //     // placeholder... do something more interesting
// //     alert(`You clicked the button to buy the ${data.title}.`)
// //   }

//   // inject a random placeholder image from the Lorem Picsum API
//   // the mockaroo API we're using doesn't include this
//   // ultimately, this data would come from the API
//   const imgSrc = `https://picsum.photos/200?id=${props.boardId}` // tack on the animal ID to the query
//   console.log(data.descriptionLong)
//   return (
//     <div className="AnimalsList">
//       <h1>{data.title}</h1>
//       <section className="main-content">
//         <article className="board" key={data.id}>
//           <img alt={data.title} src={imgSrc} />
//           <div className="details">
//             <address className="description">{data.descriptionLong}</address>
//             <strong className="member-count">{data.memberCount}</strong>
//             {/* <p>{data.description}</p>
//             <button className="buy-now" onClick={handleBuyButtonClick}>
//               Buy now!
//             </button> */}
//           </div>
//         </article>
//       </section>
//     </div>
//   )
// }

// // make this function available to be imported into another module
// export default BoardDetail

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './BoardDetail.css';

const BoardDetail = () => {
  const { id } = useParams();            // <-- get :id from URL
  const [board, setBoard] = useState(null);

  useEffect(() => {
    axios.get('https://my.api.mockaroo.com/mock_boards_data.json', {
      headers: { 'X-API-Key': 'dc8ece40', Accept: 'application/json' },
      params: { count: 50 }              // returns an array
    })
    .then(res => {
      const list = Array.isArray(res.data) ? res.data : [res.data];
      const found = list.find(item => String(item.id) === String(id));
      setBoard(found || list[0]);        // fallback if not found
    })
    .catch(err => {
      console.error('Mockaroo error:', err);
      setBoard({
        id: 1,
        title: 'Your Cool Board',
        memberCount: 10,
        coverPhotoURL: 'https://picsum.photos/800/400?seed=fallback',
        descriptionLong:
          'Fallback description: sample long text about this board.',
      });
    });
  }, [id]);

  if (!board) return <div>Loading…</div>;

  const imageSrc = `https://picsum.photos/800/400?seed=board-${board.id}`;

  const description =
    board.descriptionLong ||
    board.descriptionShort ||
    'No description provided.';

  return (
    <div className="BoardDetail">
      <h1>{board.title}</h1>
      <section className="main-content">
        <article className="board" key={board.id}>
          <img alt={board.title} src={imageSrc} className="board-image" />
          <div className="details">
            <p className="description">{description}</p>
            <p><strong>Members:</strong> {board.memberCount}</p>
            <button className="back-button" onClick={() => window.history.back()}>
              ← Back to Boards
            </button>
          </div>
        </article>
      </section>
    </div>
  );
};

export default BoardDetail;