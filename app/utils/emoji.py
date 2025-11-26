import re
import json
import os
from typing import Dict, List, Optional
from pathlib import Path

class EmojiHandler:
    """Emoji handling utilities for chat messages"""
    
    # Common emoji categories
    EMOJI_CATEGORIES = {
        "smileys": "Smileys & Emotion",
        "people": "People & Body",
        "animals": "Animals & Nature",
        "food": "Food & Drink",
        "travel": "Travel & Places",
        "activities": "Activities",
        "objects": "Objects",
        "symbols": "Symbols",
        "flags": "Flags"
    }
    
    # Load emoji data
    _emoji_data = None
    
    @classmethod
    def _load_emoji_data(cls):
        """Load emoji data from JSON file or default dictionary"""
        if cls._emoji_data is None:
            try:
                # Try to load from file first
                module_dir = os.path.dirname(os.path.abspath(__file__))
                emoji_file = os.path.join(module_dir, "emoji_data.json")
                
                if os.path.exists(emoji_file):
                    with open(emoji_file, 'r', encoding='utf-8') as f:
                        cls._emoji_data = json.load(f)
                else:
                    # Fallback to basic emoji set
                    cls._emoji_data = {
                        "smileys": {
                            "😀": ":grinning_face:",
                            "😃": ":smiley:",
                            "😄": ":smile:",
                            "😁": ":grin:",
                            "😆": ":laughing:",
                            "😅": ":sweat_smile:",
                            "🤣": ":rofl:",
                            "😂": ":joy:",
                            "🙂": ":slightly_smiling_face:",
                            "🙃": ":upside_down_face:",
                            "😉": ":wink:",
                            "😊": ":blush:",
                            "😇": ":innocent:",
                        },
                        "reactions": {
                            "👍": ":thumbs_up:",
                            "👎": ":thumbs_down:",
                            "❤️": ":heart:",
                            "😂": ":joy:",
                            "😮": ":open_mouth:",
                            "😢": ":cry:",
                            "👏": ":clap:",
                            "🔥": ":fire:",
                            "🚀": ":rocket:",
                            "🎉": ":tada:",
                        }
                    }
            except Exception:
                # If all fails, use minimal set
                cls._emoji_data = {
                    "reactions": {
                        "👍": ":thumbs_up:",
                        "❤️": ":heart:", 
                        "😂": ":joy:",
                        "👏": ":clap:",
                        "🔥": ":fire:",
                    }
                }
        
        return cls._emoji_data
    
    @classmethod
    def get_emoji_categories(cls) -> List[str]:
        """Get list of available emoji categories"""
        return list(cls._load_emoji_data().keys())
    
    @classmethod
    def get_emoji_by_category(cls, category: str) -> Dict[str, str]:
        """Get all emojis in a category"""
        emojis = cls._load_emoji_data().get(category, {})
        return emojis
    
    @classmethod
    def get_all_emojis(cls) -> Dict[str, Dict[str, str]]:
        """Get all available emojis by category"""
        return cls._load_emoji_data()
    
    @classmethod
    def get_reaction_emojis(cls) -> Dict[str, str]:
        """Get common reaction emojis"""
        return cls.get_emoji_by_category("reactions")
    
    @staticmethod
    def contains_emoji(text: str) -> bool:
        """Check if text contains emoji characters"""
        # Basic emoji detection pattern (not comprehensive)
        emoji_pattern = re.compile(
            "["
            "\U0001F600-\U0001F64F"  # emoticons
            "\U0001F300-\U0001F5FF"  # symbols & pictographs
            "\U0001F680-\U0001F6FF"  # transport & map symbols
            "\U0001F700-\U0001F77F"  # alchemical symbols
            "\U0001F780-\U0001F7FF"  # geometric shapes
            "\U0001F800-\U0001F8FF"  # supplemental arrows
            "\U0001F900-\U0001F9FF"  # supplemental symbols & pictographs
            "\U0001FA00-\U0001FA6F"  # chess symbols
            "\U0001FA70-\U0001FAFF"  # symbols & pictographs extended-A
            "\U00002702-\U000027B0"  # dingbats
            "\U000024C2-\U0001F251" 
            "]+"
        )
        return bool(emoji_pattern.search(text))
    
    @staticmethod
    def extract_emojis(text: str) -> List[str]:
        """Extract all emojis from text"""
        emoji_pattern = re.compile(
            "["
            "\U0001F600-\U0001F64F"  # emoticons
            "\U0001F300-\U0001F5FF"  # symbols & pictographs
            "\U0001F680-\U0001F6FF"  # transport & map symbols
            "\U0001F700-\U0001F77F"  # alchemical symbols
            "\U0001F780-\U0001F7FF"  # geometric shapes
            "\U0001F800-\U0001F8FF"  # supplemental arrows
            "\U0001F900-\U0001F9FF"  # supplemental symbols & pictographs
            "\U0001FA00-\U0001FA6F"  # chess symbols
            "\U0001FA70-\U0001FAFF"  # symbols & pictographs extended-A
            "\U00002702-\U000027B0"  # dingbats
            "\U000024C2-\U0001F251" 
            "]+"
        )
        return emoji_pattern.findall(text) 