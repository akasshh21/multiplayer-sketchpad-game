# Web Slinger’s Sketchpad

A real-time multiplayer drawing and guessing game inspired by Skribbl.io.

## Tech Stack
- Python
- FastAPI
- Socket.IO
- React
- Tailwind CSS

## Features
- Create or join rooms using a code
- Real-time multiplayer drawing
- Live guessing through chat
- Score tracking for players

## Overview

Players join a room using a 5-char code. One player draws, others guess in real time.

### Game Flow
- Create/join room
- Start the game, drawer receives word choices
- Drawer draws, guessers see strokes and type guesses
- Correct/close guesses detected server side and scores are updated accordingly

## Tech Stack

### Backend
- FastAPI
- python-socketio

### Frontend
- React
- Tailwind CSS
- socket.io-client
