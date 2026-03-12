import random
import string
from typing import Dict, List
from datetime import datetime

class RoomManager:
    def __init__(self):
        self.active_rooms: Dict[str, dict] = {}
        
    def generate_room_code(self):
        while True:
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
            if code not in self.active_rooms:
                return code
    
    def create_room(self, host_id, host_name, host_avatar):
        
        room_code = self.generate_room_code()
        self.active_rooms[room_code] = {
            "code": room_code,
            "host_id": host_id,
            "players": {
                host_id: {
                    "id": host_id,
                    "name": host_name,
                    "avatar": host_avatar,
                    "score": 0,
                    "has_guessed": False
                }
            },
            "game_started": False,
            "current_round": 0,
            "current_drawer_id": None,
            "secret_word": None,
            "round_start_time": None,
            "guessed_players": []
        }



        return room_code
    
    def join_room(self, room_code, player_id, player_name, player_avatar):
        if room_code not in self.active_rooms:
            return False
        
        room = self.active_rooms[room_code]
        if len(room["players"]) >= 8:
            return False
        
        room["players"][player_id] = {
            "id": player_id,
            "name": player_name,
            "avatar": player_avatar,
            "score": 0,
            "has_guessed": False
        }
        return True
    
    def remove_player(self, room_code, player_id):
        if room_code in self.active_rooms:
            room = self.active_rooms[room_code]
            if player_id in room["players"]:
                del room["players"][player_id]
            if len(room["players"]) == 0:
                del self.active_rooms[room_code]
    
    def get_room(self, room_code: str):
        return self.active_rooms.get(room_code)

room_manager = RoomManager()