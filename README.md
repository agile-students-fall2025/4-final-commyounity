# CommYOUnity

## Deployment
CommYOUnity has been deployed on
https://octopus-app-mnshq.ondigitalocean.app/

## Extra-credit

This team has completed extra credit assignment `Continuous Integration` for Sprint 3.

---

## Product Vision Statement

CommYOUnity is a social app designed to connect internstional students and people seeking cultural connections in the NYC area. CommYOUnity helps them find and join commYOUnity boards centered on shared heritage and interests. 

---

### MVP

The MVP will focus on enabling users to sign up/log in, join or create CommYOUnity boards, interact within those boards, and manage their profiles.

--- 

### Themes

1. User Access and Onboarding: Users must be able to sign up, long in, and create a profile.
2. CommYOUnity Discovery: Users must be able to browse existing commYOUnity boards and view existing members. 
3. CommYOUnity Participation: Users must be able to join, post, and leave commYOUnity boards.
4. CommYOUnity Creation and Management: Users must be able to create new boards, and invite new members to join.
5. Profile Management: Users must be able to manage their profiles.
6. Friends & Connections: 
   Users can find, add, and manage friends to extend their community connections.

### Features per Theme

1. User Access and Onboarding
- Necessary Features:
  - Sign Up / Log In  
- Nice to Have:  
  - Add photos

2. CommYOUnity Discovery
- Necessary Features: 
  - Browse a list of CommYOUnity boards  
  - View brief descriptions of each board  
  - View the list of members in each board  
- Nice to Have: 
  - Filter based on interest/culture  
  - Search for specific CommYOUnities

3. CommYOUnity Participation 
- Necessary Features:  
  - Join a board  
  - View a board and see posts/events  
  - Post updates or messages  
  - Leave a board  
- Nice to Have: 
  - Private messaging between board members 

4. CommYOUnity Creation and Management
- Necessary Features: 
  - Create a new board (add board description, culture, and interests)  
  - Edit an existing board  
  - Invite and manage members  
- Nice to Have:  
  - Board analytics (e.g., member count, engagement stats)

5. Profile Management: 
- Necessary Features: 
  - Change photo  
  - Change password  
  - Update contact info  
  - Access settings (privacy, notifications)  
  - Delete profile  
- Nice to Have: 
  - Profile analytics or engagement tracking  

6. Friends & Connections
- Necessary Features:
  - Find and add friends  
  - Accept or decline friend requests  
  - View friend list  
  - Remove friends  
- Nice to Have: 
  - Mutual friends view  
  - Shared boards or cultural match suggestions 

--- 

### User Stories

1. User Access and Onboarding:
- As a *new user*, I want to *sign up using my email address,* so that I can create an account quickly.
- As an *existing user,* I want to *log in securely,* so that I can access my commYOUnities.

2. CommYOUnity Discovery:
- As a *user,* I want to *browse available CommmYOUnity Boards,* so that I can find commYOUnities that match my background or interests.
- As a *user,* I want to *view the members of a board,* so that I know who is the group before joining.


3. CommYOUnity Discovery:
- As a *user*, I want to *join a CommYOUnity Board*, so that I can connect with others who share my heritage.
- As a *commYOUnity board member,* I want to *post messages or events,* so that I can share updates with my community.
- As a *commYOUnity board member,* I want to *be able to leave a CommYOUnity Board,* so that I can manage which communities I’m part of.

4. CommYOUnity Creation and Management:
- As a *user,* I want to *create a new CommYOUnity Board,* so that I can bring together others from my culture or background.
- As a *CommYOUnity Board creator,* I want to *invite members,* so that my board can grow and stay active.

5. Profile Management:
- As a *user,* I want to *update my profile info, such as my photo and contact details,* so that my community sees accurate, up-to-date information about me.
- As a *user,* I want to *change my password,* so that I can keep my account secure.
- As a *user,* I want to *manage my privacy and notification preferences,* so that I control my visibility, contact, and data.
- As a *user,* I want to *be able to delete my profile,* so that I can remove all my personal data from the app.

6. Friends & Connections 
- As a *user*, I want to *search for and add friends* so that I can connect beyond boards.  
- As a *user*, I want to *accept or reject friend requests* so that I can control my connections.  
- As a *user*, I want to *view and manage my friend list* so that I can stay in touch with people I know.  
- As a *user*, I want to *remove a friend* so that I can control my social circle.  

---

## Core Team Members:
- Carina Ilie
    - [GitHub account](https://github.com/carinutza)
    - [LinkedIn](https://www.linkedin.com/in/carina-ilie-73659a240/)
- Lovinsh Julka
    - [GitHub account](https://github.com/Lovnish2145)
- Vincent Su
    - [GitHub account](https://github.com/Vincent08199)
- Varun Pandian
    - [GitHub account](https://github.com/V-run64)
- Leo Fu
    - [GitHub account](https://github.com/LeoFYH)

## Short History & Contibutions

This project was designed by interational students for internstional students. We have noticed that most international students have a hard time when they first move abroad for their studies. To ease this transition, we cam up wit CommYOUnity - an app that can bring "home" closer. 

If you wish to contibute to this project, please visit the [CONTRIBUTING.md](./CONTRIBUTING.md) document.

---

## Getting Started

### Prerequisites

- Node.js (v14 or higher recommended)
- npm (comes with Node.js)
- A Mockaroo API key (free account available at [mockaroo.com](https://www.mockaroo.com/))

> **Note on mock friends data:** The friends/friend-requests service only seeds mock data in development. To enable seeding locally, set `ALLOW_MOCK_FRIEND_SEED=true` in `back-end/.env`. Leave this unset/false in production so no fake friends are inserted; production should use real Mongo data instead.

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/agile-students-fall2025/4-final-commyounity.git
   cd 4-final-commyounity
   ```

2. **Set up the back-end**
   ```bash
   cd back-end
   npm install
   ```

3. **Configure back-end environment variables (optional)**
   - Create a `.env` file in the `back-end` directory (optional, API key is currently hardcoded):
     ```env
     MOCKAROO_API_KEY=your key
     PORT=3000
     ```
   - Get your free Mockaroo API key from [mockaroo.com](https://www.mockaroo.com/)

4. **Start the back-end server**
   ```bash
   npm start
   ```
   The server will run on [http://localhost:3000](http://localhost:3000)
   
   Or use `npm run dev` for development with auto-reload (if nodemon is installed).

5. **Set up the front-end** (in a new terminal window)
   ```bash
   cd front-end
   npm install
   ```

6. **Configure front-end environment variables**
   - Create a `.env` file in the `front-end` directory
   - Add your Mockaroo API key to the `.env` file:
     ```env
     REACT_APP_KEY=your_mockaroo_api_key_here
     ```

7. **Run the front-end development server**
   ```bash
   npm start
   ```
   The app will open at [http://localhost:3001](http://localhost:3001) (or another available port)

For detailed setup instructions, please refer to the [front-end README](./front-end/README.md).

---

## Project Structure

```
4-final-commyounity/
├── front-end/          # React.js front-end application
│   ├── src/            # Source code
│   ├── public/         # Public assets
│   └── README.md       # Front-end setup instructions
├── back-end/           # Express.js back-end (Sprint 2)
│   ├── app.js          # Express application and routes
│   ├── server.js       # Server entry point
│   └── package.json    # Back-end dependencies
├── ux-design/          # Wireframes and prototypes
└── README.md           # This file
```

## Back-End API Endpoints

The back-end provides the following API endpoints:

### Boards
- `GET /api/boards` - Get all boards
- `GET /api/boards/:id` - Get a single board by ID

### Authentication
- `POST /api/auth/signup` - Sign up a new user
  - Body: `{ username, email, password, confirmPassword }`
- `POST /api/auth/login` - Login user
  - Body: `{ username, password }` (username can be email or username)
- `GET /api/user/me` - Get current user information

All API routes return JSON responses in the format:
- Success: `{ data: {...} }` or `{ message: "...", data: {...} }`
- Error: `{ error: "error message" }`

# API Documentation

## Endpoints

### 1. Get Members
- **URL**: `/api/members`
- **Method**: GET
- **Description**: Fetches a list of members.

### 2. Get Boards
- **URL**: `/api/boards`
- **Method**: GET
- **Description**: Fetches a list of boards.

### 3. Login
- **URL**: `/api/auth/login`
- **Method**: POST
- **Description**: Authenticates a user.

### 4. Signup
- **URL**: `/api/auth/signup`
- **Method**: POST
- **Description**: Registers a new user.

---

## Notes
- Replace `mock-jwt-token` with a real JWT token in production.
- Ensure `.env` files are used to store sensitive information like API keys.

## Development Notes

- The back-end uses Mockaroo for mock data when available, with fallback hardcoded data
- User authentication is currently mocked (in-memory storage) and does not persist between server restarts
- All routes are configured with CORS to allow front-end requests
- API keys and credentials should be stored in `.env` files and never committed to version control
