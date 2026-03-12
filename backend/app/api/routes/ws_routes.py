import socketio
from datetime import datetime
from app.handlers.room_handler import room_manager
from app.handlers.game_logic import game_engine

socket_to_player = {}

async def handle_player_join(sid, data, sio):
    room_code = data.get("room_code")
    player_id = data.get("player_id")
    player_name = data.get("player_name")
    player_avatar = data.get("player_avatar")
    
    room = room_manager.get_room(room_code)
    if not room:
        await sio.emit("error", {"message": "Room not found"}, room=sid)
        return
    
    socket_to_player[sid] = {
        "player_id": player_id,
        "room_code": room_code
    }
    
    if player_id in room["players"]:
        room["players"][player_id]["socket_id"] = sid
    
    await sio.enter_room(sid, room_code)
    
    await sio.emit("player_list_update", {
        "players": list(room["players"].values())
    }, room=room_code)

async def handle_start_game(sid, data, sio):
    room_code = data.get("room_code")
    room = room_manager.get_room(room_code)
    
    if not room:
        return
    
    room["game_started"] = True
    room["current_round"] = 1
    player_ids = list(room["players"].keys())
    room["current_drawer_id"] = player_ids[0]

    await sio.emit("game_started", {
        "drawer_id": room["current_drawer_id"],
        "round": room["current_round"],
        "duration": 90
    }, room=room_code)

    word_choices = game_engine.get_word_choices(3)
    drawer_socket_id = room["players"][room["current_drawer_id"]].get("socket_id")
    
    if drawer_socket_id:
        await sio.emit("word_selection", {
            "words": word_choices,
            "timeout": 10
        }, room=drawer_socket_id)

async def handle_word_chosen(sid, data, sio):
    room_code = data.get("room_code")
    chosen_word = data.get("word")
    
    room = room_manager.get_room(room_code)
    if not room:
        return
    
    room["secret_word"] = chosen_word
    room["round_start_time"] = datetime.now()
    room["guessed_players"] = []
    
    for player in room["players"].values():
        player["has_guessed"] = False
    
    hint_pattern = game_engine.get_hint_pattern(chosen_word)
    
    drawer_id = room["current_drawer_id"]
    drawer_socket_id = room["players"][drawer_id].get("socket_id")
    
    for player_id, player in room["players"].items():
        player_socket = player.get("socket_id")
        if player_socket and player_id != drawer_id:
            await sio.emit("round_started", {
                "hint": hint_pattern,
                "drawer_id": drawer_id,
                "duration": 90
            }, room=player_socket)
    
    if drawer_socket_id:
        await sio.emit("drawing_ready", {
            "word": chosen_word,
            "duration": 90
        }, room=drawer_socket_id)

async def handle_draw_stroke(sid, data, sio):
    room_code = data.get("room_code")
    stroke_data = data.get("stroke")
    
    await sio.emit("draw_update", {
        "stroke": stroke_data
    }, room=room_code, skip_sid=sid)

async def handle_clear_canvas(sid, data, sio):
    room_code = data.get("room_code")
    
    await sio.emit("canvas_cleared", {}, room=room_code, skip_sid=sid)

async def handle_chat_message(sid, data, sio):
    room_code = data.get("room_code")
    player_id = data.get("player_id")
    message = data.get("message")
    
    room = room_manager.get_room(room_code)
    if not room or not room["game_started"]:
        await sio.emit("chat_message", {
            "player_id": player_id,
            "player_name": room["players"][player_id]["name"],
            "message": message,
            "type": "chat"
        }, room=room_code)
        return
    
    if player_id == room["current_drawer_id"]:
        return
    
    if room["players"][player_id]["has_guessed"]:
        await sio.emit("chat_message", {
            "player_id": player_id,
            "player_name": room["players"][player_id]["name"],
            "message": message,
            "type": "chat"
        }, room=room_code)
        return
    
    guess_result = game_engine.check_guess(message, room["secret_word"])
    
    if guess_result["correct"]:
        time_elapsed = (datetime.now() - room["round_start_time"]).total_seconds()
        score = game_engine.calculate_score(time_elapsed, 90, 1000)
        
        room["players"][player_id]["score"] += score
        room["players"][player_id]["has_guessed"] = True
        room["guessed_players"].append(player_id)
        
        drawer_id = room["current_drawer_id"]
        room["players"][drawer_id]["score"] += 200
        
        await sio.emit("correct_guess", {
            "player_id": player_id,
            "player_name": room["players"][player_id]["name"],
            "score": score,
            "total_score": room["players"][player_id]["score"]
        }, room=room_code)
        
        total_players = len([p for p in room["players"].values() if p["id"] != drawer_id])
        if total_players > 0 and len(room["guessed_players"]) >= total_players * 0.75:
            await end_round(room_code, sio)
        
    elif guess_result["close"]:
        await sio.emit("close_guess", {
            "message": "Close guess!"
        }, room=sid)
    else:
        await sio.emit("chat_message", {
            "player_id": player_id,
            "player_name": room["players"][player_id]["name"],
            "message": message,
            "type": "guess"
        }, room=room_code)

async def end_round(room_code, sio):
    room = room_manager.get_room(room_code)
    if not room:
        return
    
    await sio.emit("round_ended", {
        "word": room["secret_word"],
        "scores": {pid: p["score"] for pid, p in room["players"].items()}
    }, room=room_code)
    
    player_ids = list(room["players"].keys())
    current_index = player_ids.index(room["current_drawer_id"])
    next_index = (current_index + 1) % len(player_ids)
    
    room["current_drawer_id"] = player_ids[next_index]
    room["current_round"] += 1
    room["secret_word"] = None
    
    word_choices = game_engine.get_word_choices(3)
    next_drawer_socket = room["players"][room["current_drawer_id"]].get("socket_id")
    
    if next_drawer_socket:
        await sio.emit("word_selection", {
            "words": word_choices,
            "timeout": 10
        }, room=next_drawer_socket)
    
    await sio.emit("game_started", {
        "drawer_id": room["current_drawer_id"],
        "round": room["current_round"],
        "duration": 90
    }, room=room_code)

async def handle_request_word_choices(sid, data, sio):
    room_code = data.get("room_code")
    room = room_manager.get_room(room_code)
    if not room:
        return

    if not room["game_started"] or room.get("secret_word"):
        return

    current_drawer_id = room["current_drawer_id"]
    drawer_socket_id = room["players"][current_drawer_id].get("socket_id")
    if not drawer_socket_id or drawer_socket_id != sid:
        return

    word_choices = game_engine.get_word_choices(3)
    await sio.emit("word_selection", {
        "words": word_choices,
        "timeout": 10
    }, room=sid)

def register_socket_events(sio):
    @sio.event
    async def connect(sid, environ):
        print(f"Client connected: {sid}")
    
    @sio.event
    async def disconnect(sid):
        print(f"Client disconnected: {sid}")
        
        if sid in socket_to_player:
            player_info = socket_to_player[sid]
            room_code = player_info["room_code"]
            player_id = player_info["player_id"]
            
            room = room_manager.get_room(room_code)
            if room and player_id in room["players"]:
                room["players"][player_id].pop("socket_id", None)
            
            del socket_to_player[sid]
    
    @sio.on("join_room")
    async def on_join(sid, data):
        await handle_player_join(sid, data, sio)
    
    @sio.on("start_game")
    async def on_start(sid, data):
        await handle_start_game(sid, data, sio)
    
    @sio.on("word_chosen")
    async def on_word(sid, data):
        await handle_word_chosen(sid, data, sio)
    
    @sio.on("draw_stroke")
    async def on_draw(sid, data):
        await handle_draw_stroke(sid, data, sio)
    
    @sio.on("clear_canvas")
    async def on_clear(sid, data):
        await handle_clear_canvas(sid, data, sio)
    
    @sio.on("chat_message")
    async def on_chat(sid, data):
        await handle_chat_message(sid, data, sio)

    @sio.on("request_word_choices")
    async def on_request_word_choices(sid, data):
        await handle_request_word_choices(sid, data, sio)