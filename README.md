# Web Slinger’s Sketchpad

A real-time multiplayer drawing and guessing game inspired by Skribbl.io.

## Features
- Create or join rooms using a code
- Real-time multiplayer drawing
- Live guessing through chat
- Score tracking for players

## Overview
Players join a room using a 5-character code. One player draws while others guess in real time.

## Game Flow
- Create or join a room
- Start the game and the drawer receives word choices
- Drawer draws on the canvas while guessers see strokes in real time
- Players type guesses in chat
- Correct or close guesses are detected server-side and scores are updated

## Tech Stack

### Backend
- Python
- FastAPI
- python-socketio

### Frontend
- React
- Tailwind CSS
- socket.io-client
