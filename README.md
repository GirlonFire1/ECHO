# FastAPI Real-time Chat Room API

A production-ready chat room API built with FastAPI featuring WebSockets, user authentication, message persistence, and moderation features.

## Features

- **Authentication & User Management**
  - JWT-based authentication
  - User registration and login
  - User roles (Admin, Moderator, Regular User)
  - User profile management

- **Chat Room Management**
  - Create/delete rooms
  - Public and private rooms
  - Room permissions and member management
  - Join/leave functionality

- **Real-time Messaging**
  - WebSocket connections for instant communication
  - Message history persistence
  - Direct messaging between users
  - Typing indicators
  - Online/offline status tracking

- **Moderation Features**
  - Profanity filtering
  - Rate limiting
  - User muting and banning
  - Message reporting system
  - Admin/moderator tools

- **Advanced Features**
  - Message reactions (emoji)
  - Scheduled messages
  - Temporary rooms
  - File sharing

## Tech Stack

- **FastAPI** - Modern API framework with async support
- **SQLAlchemy** - SQL toolkit and ORM
- **SQLite** - Lightweight database for development
- **Pydantic** - Data validation and settings management
- **WebSockets** - Real-time bi-directional communication
- **JWT** - Secure user authentication
- **Alembic** - Database migrations

## Getting Started

### Prerequisites

- Python 3.8+
- pip

### Installation

1. Clone the repository

2. Create a virtual environment and activate it
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies
   ```bash
   pip install -r requirements.txt
   ```

4. Run the application
   ```bash
   uvicorn app.main:app --reload
   ```

5. Access the API documentation at `http://localhost:8000/docs`

### Environment Variables

Create a `.env` file in the project root with the following variables (optional):

```
SECRET_KEY=your_secret_key
DATABASE_URL=sqlite:///./chatroom.db
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout

### User Management
- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/me` - Update profile
- `GET /api/v1/users/{user_id}` - Get user profile
- `POST /api/v1/users/upload-avatar` - Upload avatar

### Room Management
- `GET /api/v1/rooms` - List available rooms
- `POST /api/v1/rooms` - Create room
- `GET /api/v1/rooms/{room_id}` - Get room details
- `PUT /api/v1/rooms/{room_id}` - Update room
- `DELETE /api/v1/rooms/{room_id}` - Delete room
- `POST /api/v1/rooms/{room_id}/join` - Join room
- `POST /api/v1/rooms/{room_id}/leave` - Leave room

### Message Management
- `GET /api/v1/rooms/{room_id}/messages` - Get message history
- `POST /api/v1/rooms/{room_id}/messages` - Send message
- `PUT /api/v1/messages/{message_id}` - Edit message
- `DELETE /api/v1/messages/{message_id}` - Delete message
- `POST /api/v1/messages/{message_id}/react` - Add reaction

### Moderation
- `POST /api/v1/rooms/{room_id}/mute/{user_id}` - Mute user
- `POST /api/v1/rooms/{room_id}/ban/{user_id}` - Ban user
- `POST /api/v1/messages/{message_id}/report` - Report message
- `GET /api/v1/messages/admin/reports` - View reports (admin only)

### WebSocket Endpoints
- `/ws/{room_id}?token=...` - Real-time room connection
- `/ws/dm/{user_id}?token=...` - Direct message connection

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributors

Initially created by AI Coding Assistant 