import api from './axiosConfig';
import { RoomCreate } from '@/types';

export const getRooms = async () => {
    try {
        const response = await api.get('/rooms/');
        if (Array.isArray(response.data)) {
            return response.data;
        }
        console.error("getRooms API did not return an array:", response.data);
        return [];
    } catch (error) {
        console.error("Error fetching rooms:", error);
        return [];
    }
};

export const getRoom = async (roomId: string) => {
    const response = await api.get(`/rooms/${roomId}`);
    return response.data;
};

export const createRoom = async (roomData: RoomCreate) => {
    const response = await api.post('/rooms/', roomData);
    return response.data;
};

export const joinRoomByCode = async (joinCode: string) => {
    const response = await api.post(`/rooms/join/${joinCode}`, {});
    return response.data;
};

export const createOrGetDM = async (targetUserId: string) => {
    const response = await api.post('/rooms/dm', { target_user_id: targetUserId });
    return response.data;
};
