import api from './axiosConfig';

export const getMessages = async (roomId: string) => {
    const response = await api.get(`/messages/rooms/${roomId}/messages`);
    return response.data;
};
