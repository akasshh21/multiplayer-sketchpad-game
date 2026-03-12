import json
import random
from difflib import SequenceMatcher

class GameEngine:
    def __init__(self):
        self.load_word_bank()
    
    def load_word_bank(self):
        word_file = "./app/words.json"
        with open(word_file, 'r') as f:
            data = json.load(f)
            self.word_bank = data["words"]
    
    def get_word_choices(self, count=3):
        return random.sample(self.word_bank, min(count, len(self.word_bank)))
    
    def calculate_similarity(self, guess, target):
        return SequenceMatcher(None, guess.lower(), target.lower()).ratio()
    
    def check_guess(self, guess, target):
        guess_clean = guess.strip().lower()
        target_clean = target.lower()
        
        if guess_clean == target_clean:
            return {"correct": True, "close": False}
        
        similarity = self.calculate_similarity(guess_clean, target_clean)
        if similarity >= 0.75:
            return {"correct": False, "close": True}
        
        return {"correct": False, "close": False}
    
    def calculate_score(self, time_elapsed, total_time, max_score):



        if time_elapsed >= total_time:
            return 0
        
        deduction = (time_elapsed / total_time) * (max_score * 0.6)
        final_score = max(0, int(max_score - deduction))
        return final_score
    
    def get_hint_pattern(self, word: str, revealed_letters: set = None):
        
        if revealed_letters is None:
            revealed_letters = set()
        
        return ' '.join([char if char.lower() in revealed_letters else '_' for char in word])

game_engine = GameEngine()