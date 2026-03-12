# Web Slinger’s Sketchpad

Lightweight multiplayer drawing and guessing game (Skribbl like) with a FastAPI + Socket.IO backend and React frontend

## Overview

Players join a room using a 5‑char code. One player draws, others guess in real time

flow:
- Create/join room
- Start the game, drawer receives word choices
- Drawer draws, guessers see strokes and type guesses
- Correct/close guesses detected server side and scores are updated accordingly

## Tech stack

- Backend
  - FastAPI
  - python-socketio

- Frontend
  - React
  - Tailwind CSS
  - socket.io-client


## Installation

Prerequisites:
- Python 3.11+
- Node.js 18+

Backend:
```sh
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
```

Fronten:
```sh
cd frontend
npm install
```

## Run locally

Run backend:
```sh
cd backend
uvicorn app.main:socket_app --reload
```

run frontend:
```sh
cd frontend
npm run dev
```

## Test the flow

- Open two browser windows at http://localhost:5173
- Window A: Create room. Window B: Join using the code
- Click Start Game (host)
- Drawer gets 3 words (private). others see masked hint
- Drawer draws. others guess in chat
- Correct guesses award points. Round ends on timer or threshold

## Demo

<video controls>
    <source src="assets/video.mp4" type="video/mp4">
    Your browser does not support the video tag
</video>

## Assumptions & limitations

- In-memory state only(rooms and scores reset on server restart)
- No auth. players identified by ephemeral IDs
- Basic similarity check for “close” guesses
- No persistence, rate limiting, or profanity filtering
