# AI Coding Agent Guidelines for 4-final-commyounity

## Project Overview
This repository is a collaborative platform for managing boards, feeds, and user interactions. It consists of three main components:

1. **Front-End**: Located in `front-end/`, built with React. It handles user interactions and displays data fetched from the back-end.
2. **Back-End**: Located in `back-end/`, built with Node.js and Express. It provides APIs for authentication, board management, and user interactions.
3. **Database**: The back-end interacts with a database (not included in the repository) to persist data.

## Key Files and Directories
- **Front-End**:
  - `src/`: Contains React components, CSS files, and tests.
  - `public/`: Static assets like `index.html` and `manifest.json`.
- **Back-End**:
  - `routes/`: Defines API endpoints (e.g., `authentication-routes.js`, `boardfeed.js`).
  - `models/`: Defines data models (e.g., `User.js`, `Board.js`).
  - `services/`: Contains business logic (e.g., `friendsService.js`).
  - `config/`: Configuration files (e.g., `jwt-config.js`).
  - `test/`: Contains unit and integration tests.
- **Shared**:
  - `README.md`: Provides setup and usage instructions.

## Development Workflows
### Front-End
1. Install dependencies:
   ```bash
   cd front-end
   npm install
   ```
2. Start the development server:
   ```bash
   npm start
   ```
3. Run tests:
   ```bash
   npm test
   ```

### Back-End
1. Install dependencies:
   ```bash
   cd back-end
   npm install
   ```
2. Start the server:
   ```bash
   node server.js
   ```
3. Run tests:
   ```bash
   npm test
   ```

## Project-Specific Conventions
- **API Design**: Follow RESTful principles. Routes are grouped by functionality (e.g., `authentication-routes.js` for login/signup).
- **Component Structure**: React components are modular and styled with corresponding CSS files.
- **Testing**: Tests are colocated with the code they test (e.g., `App.test.js` for `App.js`).
- **Error Handling**: Use middleware in the back-end for consistent error responses.

## Integration Points
- **Authentication**: JWT-based authentication is implemented in the back-end (`jwt-config.js`).
- **Data Flow**: The front-end communicates with the back-end via REST APIs.
- **External Libraries**:
  - Front-End: React, React Router.
  - Back-End: Express, JWT, and others (see `package.json`).

## Examples
### Adding a New API Endpoint
1. Create a new file in `routes/` (e.g., `newFeature.js`).
2. Define the route and logic:
   ```javascript
   const express = require('express');
   const router = express.Router();

   router.get('/new-feature', (req, res) => {
       res.send('New feature works!');
   });

   module.exports = router;
   ```
3. Register the route in `app.js`:
   ```javascript
   const newFeature = require('./routes/newFeature');
   app.use('/api', newFeature);
   ```

### Adding a New React Component
1. Create a new file in `src/` (e.g., `NewFeature.js`).
2. Define the component:
   ```javascript
   import React from 'react';

   const NewFeature = () => {
       return <div>New Feature</div>;
   };

   export default NewFeature;
   ```
3. Import and use the component in `App.js`:
   ```javascript
   import NewFeature from './NewFeature';

   function App() {
       return (
           <div>
               <NewFeature />
           </div>
       );
   }

   export default App;
   ```

## Notes
- Ensure all new code is tested.
- Follow existing patterns for consistency.
- Update documentation (e.g., `README.md`) when adding new features.

---

Feel free to iterate on these instructions to better suit the needs of the project.