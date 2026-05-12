# AI Planner

A modern AI-powered task planner built with React, Vite, Node, Express, Firebase Authentication, and the OpenAI API. The app combines a polished productivity dashboard with user sign-in, private task workspaces, voice input, rule-based commands, and an optional backend AI assistant.

## Features

- Add, complete, delete, search, and filter tasks
- Sign up, login, and logout with Firebase Authentication
- Per-user task storage using each Firebase user's `uid`
- Due dates, priority levels, and task categories
- LocalStorage persistence for tasks
- Dashboard metrics for total, completed, pending, and high-priority tasks
- Today task focus queue
- Seven-day weekly overview
- Floating AI assistant with text and voice input
- Rule-based commands that work instantly:
  - `plan my day`
  - `show urgent`
  - `motivate me`
  - `summary`
  - `add study DSA tomorrow high`
- OpenAI-backed answers for general questions
- Secure backend API key handling with `.env`

## Tech Stack

- React
- JavaScript
- Vite
- Node.js
- Express
- Firebase Authentication
- OpenAI JavaScript SDK
- Web Speech API
- CSS

## Project Structure

```text
AIPlanner/
  server.js          Express backend for OpenAI requests
  .env.example      Safe environment variable template
  src/
    App.jsx         Main React app and planner logic
    App.css         App layout and component styles
    firebase.js     Firebase app and auth setup
    index.css       Global theme styles
    main.jsx        React entry point
```

## Setup

Install dependencies:

```bash
npm.cmd install
```

Create a root `.env` file:

```env
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4.1-mini
PORT=3001

VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Firebase Setup

1. Open the Firebase console.
2. Create a Firebase project.
3. Add a Web App to the project.
4. Copy the Firebase config values into your root `.env` file using the `VITE_FIREBASE_` names shown above.
5. Go to Authentication.
6. Click Sign-in method.
7. Enable Email/Password.
8. Restart the Vite frontend after changing `.env`.

Start the backend:

```bash
npm.cmd run dev:server
```

Start the frontend in another terminal:

```bash
npm.cmd run dev
```

Open the app:

```text
http://127.0.0.1:5173
```

## Security Notes

The OpenAI API key is never used in the React frontend. The frontend sends messages to the Express backend at `/api/assistant`, and the backend reads `OPENAI_API_KEY` from `.env`.

Firebase web config values are safe to use in the frontend, but keep them in `.env` so setup stays clean and easy to change.

Do not commit `.env` or share your API key.

## Available Scripts

```bash
npm.cmd run dev
npm.cmd run dev:server
npm.cmd run build
npm.cmd run lint
```

## Portfolio Highlights

This project demonstrates:

- Full-stack React and Node integration
- Firebase email/password authentication
- Per-user task isolation
- Safe API key handling
- AI feature integration
- Voice input with the browser Web Speech API
- Stateful UI with local persistence
- Responsive dashboard design
- Clean, beginner-friendly JavaScript
