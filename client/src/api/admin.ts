import api from './axiosConfig';

export const getStats = async () => {
    const response = await api.get('/admin/stats');
    return response.data;
};

export const getUserGrowth = async () => {
    const response = await api.get('/admin/user-growth');
    return response.data;
};

export const getMessageVolume = async () => {
    const response = await api.get('/admin/message-volume');
    return response.data;
};

export const getActiveRooms = async () => {
    const response = await api.get('/admin/active-rooms');
    return response.data;
};

export const pauseCommunications = async () => {
    const response = await api.post('/admin/pause-communications', {});
    return response.data;
};

export const resumeCommunications = async () => {
    const response = await api.post('/admin/resume-communications', {});
    return response.data;
};

export const getCommunicationsStatus = async () => {
    const response = await api.get('/admin/communications-status');
    return response.data;
};

export const getAllUsers = async () => {
    const response = await api.get('/admin/users');
    return response.data;
};

export const updateUserStatus = async (userId: string, isActive: boolean) => {
    const response = await api.put(`/admin/users/${userId}/status?is_active=${isActive}`);
    return response.data;
};

export const getAllRooms = async () => {
    const response = await api.get('/admin/rooms');
    return response.data;
};

export const deleteRoom = async (roomId: string) => {
    const response = await api.delete(`/admin/rooms/${roomId}`);
    return response.data;
};
