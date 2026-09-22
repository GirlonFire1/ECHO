import json
from typing import Dict, List, Set, Optional
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime
import asyncio


class ConnectionManager:
    def __init__(self):
        # room_id -> set of WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # user_id -> {room_id: WebSocket}
        self.user_connections: Dict[str, Dict[str, WebSocket]] = {}
        # room_id -> {user_id: timestamp}
        self.typing_status: Dict[str, Dict[str, datetime]] = {}

    async def connect(self, websocket: WebSocket, room_id: str, user_id: str):
        await websocket.accept()

        if room_id not in self.active_connections:
            self.active_connections[room_id] = set()
        self.active_connections[room_id].add(websocket)

        if user_id not in self.user_connections:
            self.user_connections[user_id] = {}
        self.user_connections[user_id][room_id] = websocket

        await self.broadcast_to_room(
            room_id=room_id,
            message={"type": "user_joined", "user_id": user_id, "timestamp": datetime.now().isoformat()}
        )

    def disconnect(self, websocket: WebSocket, room_id: str, user_id: str):
        if room_id in self.active_connections:
            self.active_connections[room_id].discard(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

        if user_id in self.user_connections and room_id in self.user_connections[user_id]:
            del self.user_connections[user_id][room_id]
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]

        # Clear typing status
        if room_id in self.typing_status and user_id in self.typing_status[room_id]:
            del self.typing_status[room_id][user_id]

    async def broadcast_to_room(self, room_id: str, message: dict):
        if room_id in self.active_connections:
            disconnected_websockets = set()
            for websocket in self.active_connections[room_id]:
                try:
                    await websocket.send_json(message)
                except WebSocketDisconnect:
                    disconnected_websockets.add(websocket)

            for websocket in disconnected_websockets:
                self.active_connections[room_id].discard(websocket)

    async def notify_message_read(self, room_id: str, message_id: str, user_id: str):
        await self.broadcast_to_room(
            room_id=room_id,
            message={
                "type": "message_read",
                "message_id": message_id,
                "user_id": user_id,
                "timestamp": datetime.now().isoformat()
            }
        )

    async def notify_message_deleted(self, room_id: str, message_id: str, deletion_type: str, deleted_by: str):
        await self.broadcast_to_room(
            room_id=room_id,
            message={
                "type": "message_deleted",
                "message_id": message_id,
                "deletion_type": deletion_type,
                "deleted_by": deleted_by,
                "timestamp": datetime.now().isoformat()
            }
        )

    async def send_personal_message(self, user_id: str, room_id: str, message: dict):
        if user_id in self.user_connections and room_id in self.user_connections[user_id]:
            websocket = self.user_connections[user_id][room_id]
            try:
                await websocket.send_json(message)
            except WebSocketDisconnect:
                self.disconnect(websocket, room_id, user_id)

    async def set_typing_status(self, room_id: str, user_id: str, is_typing: bool):
        if room_id not in self.typing_status:
            self.typing_status[room_id] = {}

        if is_typing:
            self.typing_status[room_id][user_id] = datetime.now()
        elif user_id in self.typing_status[room_id]:
            del self.typing_status[room_id][user_id]

        typing_users = list(self.typing_status[room_id].keys()) if room_id in self.typing_status else []
        await self.broadcast_to_room(
            room_id=room_id,
            message={"type": "typing_status", "users_typing": typing_users}
        )

    async def send_direct_message(self, sender_id: str, recipient_id: str, message: dict):
        for room_id, websocket in self.user_connections.get(recipient_id, {}).items():
            try:
                await websocket.send_json({**message, "type": "direct_message", "sender_id": sender_id})
            except WebSocketDisconnect:
                self.disconnect(websocket, room_id, recipient_id)

    async def broadcast_to_rooms(self, room_ids: List[str], message: dict):
        for room_id in room_ids:
            await self.broadcast_to_room(room_id, message)

    async def broadcast_to_all(self, message: dict):
        tasks = []
        for room_id in self.active_connections:
            tasks.append(self.broadcast_to_room(room_id, message))
        await asyncio.gather(*tasks)

    def get_online_users(self, room_id: Optional[str] = None) -> List[str]:
        if room_id:
            online_users = set()
            for user_id, connections in self.user_connections.items():
                if room_id in connections:
                    online_users.add(user_id)
            return list(online_users)
        else:
            return list(self.user_connections.keys())


manager = ConnectionManager()
