import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import game_routes, ws_routes

sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=["http://localhost:3000", "http://localhost:5173"],
    logger=True,
    engineio_logger=True
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(game_routes.router, prefix="/api")

ws_routes.register_socket_events(sio)

socket_app = socketio.ASGIApp(sio, app)


