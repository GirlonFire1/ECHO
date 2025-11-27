import api from './axiosConfig';

export const getMessages = async (roomId: string) => {
    const response = await api.get(`/messages/rooms/${roomId}/messages`);
    return response.data;
};

export const deleteMessage = async (messageId: string, deletionType: "for_me" | "for_everyone") => {
    const response = await api.delete(`/messages/messages/${messageId}`, {
        data: { deletion_type: deletionType }
    });
    return response.data;
};

export const clearRoomMessages = async (roomId: string) => {
    const response = await api.delete(`/messages/rooms/${roomId}/messages/clear`);
    return response.data;
};
