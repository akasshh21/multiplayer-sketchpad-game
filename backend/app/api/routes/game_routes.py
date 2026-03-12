from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.handlers.room_handler import room_manager

router = APIRouter()


class CreateRoomRequest(BaseModel):
    player_id: str
    player_name: str
    player_avatar: str



class JoinRoomRequest(BaseModel):
    room_code: str
    player_id: str
    player_name: str
    player_avatar: str



@router.post("/create-room")
async def create_room(request: CreateRoomRequest):
    room_code = room_manager.create_room(
        request.player_id,
        request.player_name,
        request.player_avatar
    )
    return {"room_code": room_code, "success": True}

@router.post("/join-room")
async def join_room(request: JoinRoomRequest):
    success = room_manager.join_room(
        request.room_code,
        request.player_id,
        request.player_name,
        request.player_avatar
    )
    if not success:
        raise HTTPException(status_code=400, detail="Cannot join room")
    return {"success": True}


@router.get("/room/{room_code}")
async def get_room(room_code: str):
    room = room_manager.get_room(room_code)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room