# AI Planner

A modern AI-powered task planner built with React, Vite, Node, Express, and the OpenAI API. The app combines a polished productivity dashboard with local task management, voice input, rule-based commands, and an optional backend AI assistant.

## Features

- Add, complete, delete, search, and filter tasks
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
```

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
- Safe API key handling
- AI feature integration
- Voice input with the browser Web Speech API
- Stateful UI with local persistence
- Responsive dashboard design
- Clean, beginner-friendly JavaScript
