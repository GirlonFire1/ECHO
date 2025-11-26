import api from './axiosConfig';
import { UserUpdate, UserStatusUpdate } from '@/types';

export const getMe = async () => {
    const response = await api.get('/users/me');
    return response.data;
};

export const updateUser = async (userData: UserUpdate) => {
    const response = await api.put('/users/me', userData);
    return response.data;
};

export const updateUserStatus = async (statusData: UserStatusUpdate) => {
    const response = await api.put('/users/me/status', statusData);
    return response.data;
};

export const searchUsers = async (searchTerm: string) => {
    const response = await api.get(`/users/?search=${searchTerm}`);
    return response.data;
};

export const uploadAvatar = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/users/upload-avatar', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const deleteAccount = async () => {
    const response = await api.delete('/users/me');
    return response.data;
};

