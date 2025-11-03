
# Front-End Development — *CommYOUnity*

This repository contains the **front-end implementation** of the *CommYOUnity* web application, developed using **React.js** as part of the Agile Development & DevOps course sprint for front-end delivery.  

The front-end demonstrates the full user interface flow of the application — including all key screens, navigation, and mock dynamic functionality — adhering to the project’s clickable prototype and clean, contemporary design.

---

## Project Overview

**CommYOUnity** is a modern social platform designed to help users:

- Create and manage community boards  
- Connect and interact with friends  
- Manage profile privacy and notifications  
- Customize their personal information and interests  

All dynamic content (friends, boards, and user data) is currently **mocked** via APIs such as [Mockaroo](https://mockaroo.com/), [Picsum](https://picsum.photos/),and [i.pravatar](https://i.pravatar.cc/) for back-end integration.

---

## Technical Implementation

| Requirement | Implementation |
|--------------|----------------|
| **React.js front-end** | Built entirely in React with functional components |
| **Functional components only** | All components use React Hooks (`useState`, `useEffect`, `useNavigate`) |
| **JSX syntax** | All UI is defined using JSX, not plain JavaScript |
| **Custom contemporary UI** | Clean blue/white/black design theme, soft shadows, rounded corners, consistent typography (Inter font) |
| **Mock images via Picsum and i.pravatar** | All profile and board images pulled dynamically from [picsum.photos](https://picsum.photos/) and [i.pravatar](https://i.pravatar.cc/)|
| **Mock data via Mockaroo** | Friends list and user data populated with mock API responses |
---

## Technologies Used

| Category | Tool / Library |
|-----------|----------------|
| Framework | React.js (Create React App) |
| Routing | React Router DOM |
| Styling | Modular CSS (per-page), optional Tailwind-compatible |
| Mock Data | Mockaroo API |
| Mock Images | Picsum Photos and i.pravatar |
| State | useState, useEffect |
| Icons | Minimal Unicode arrows |
| Version Control | Git + GitHub (Feature Branch workflow) |

---

---

## Setup & Run Instructions

### 1. Clone the repository

```bash
git clone <https://github.com/agile-students-fall2025/4-final-commyounity.git>
cd front-end
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

The application requires a Mockaroo API key to fetch mock data. You need to create a `.env` file in the `front-end` directory.

1. Create a `.env` file in the `front-end` directory:

```bash
# In the front-end directory
touch .env
```

2. Add your Mockaroo API key to the `.env` file:

```env
REACT_APP_KEY=your_mockaroo_api_key_here
```

**How to get a Mockaroo API key:**
- Visit [Mockaroo](https://www.mockaroo.com/)
- Sign up for a free account (allows 200 requests per day)
- Go to your account settings to find your API key
- Copy the API key and paste it into your `.env` file

**Note:** The `.env` file is already included in `.gitignore` and will not be committed to version control for security reasons.

### 4. Run the development server

```bash
npm start
```

This launches the app on http://localhost:3000

The page reloads automatically when you edit files. 

## Read More About Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
