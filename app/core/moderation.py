import re
from datetime import datetime, timedelta
from typing import Optional


class ProfanityFilter:
    def __init__(self):
        self.banned_words = [
            "badword1",
            "badword2",
            "badword3",
        ]
        self.pattern = re.compile(r'\b(' + '|'.join(self.banned_words) + r')\b', re.IGNORECASE)

    def contains_profanity(self, text: str) -> bool:
        return bool(self.pattern.search(text))

    def censor_text(self, text: str) -> str:
        return self.pattern.sub(lambda m: '*' * len(m.group()), text)


class RateLimiter:
    def __init__(self):
        self.message_timestamps = {}

    def check_rate_limit(self, user_id: str, messages_per_minute: int) -> bool:
        current_time = datetime.now()
        one_minute_ago = current_time - timedelta(minutes=1)

        if user_id not in self.message_timestamps:
            self.message_timestamps[user_id] = []

        # Filter out timestamps older than 1 minute
        self.message_timestamps[user_id] = [
            ts for ts in self.message_timestamps[user_id]
            if ts >= one_minute_ago
        ]

        if len(self.message_timestamps[user_id]) >= messages_per_minute:
            return False

        self.message_timestamps[user_id].append(current_time)
        return True


profanity_filter = ProfanityFilter()
rate_limiter = RateLimiter()
