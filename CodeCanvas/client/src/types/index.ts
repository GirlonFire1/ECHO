export interface User {
    id: string;
    username: string;
    email: string;
    avatar_url: string | null;
    bio: string | null;
    phone_number: string | null;
    status: string | null;
    is_active: boolean;
    created_at: string;
    last_seen: string;
    role: "regular" | "moderator" | "admin";
}

export interface Room {
    id: string;
    name: string;
    description: string | null;
    join_code: string | null;
    is_private: boolean;
    created_by: string;
    created_at: string;
    max_members: number | null;
    is_temporary: boolean;
    expires_at: string | null;
    member_count?: number;
    members?: User[];
    creator?: User;
}

export interface RoomCreate {
    name: string;
    description?: string;
    is_private?: boolean;
    max_members?: number;
    is_temporary?: boolean;
    expires_at?: string;
}

export interface Message {
    id: string;
    room_id: string;
    user_id: string;
    content: string;
    message_type: "text" | "image" | "video" | "file" | "embed" | "system" | "encrypted" | "broadcast";
    created_at: string;
    edited_at: string | null;
    senderName?: string; // For UI display
    sender_name?: string; // Backend/Legacy compatibility
    isSent?: boolean; // For UI display
    user?: Partial<User>; // Enriched data
}

export interface UserCreate {
    username: string;
    email: string;
    password: string;
    phone_number?: string;
    avatar_url?: string;
}

export interface UserUpdate {
    username?: string;
    email?: string;
    password?: string;
    avatar_url?: string;
    bio?: string;
    phone_number?: string;
    status?: string;
}

export interface UserStatusUpdate {
    status: string;
}
