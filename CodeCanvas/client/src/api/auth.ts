import api from './axiosConfig';
import { UserCreate } from '@/types';

export const login = async (username: string, password: string) => {
    const response = await api.post('/auth/login', {
        username,
        password,
    }, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        transformRequest: [(data) => {
            return Object.entries(data)
                .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
                .join('&');
        }]
    });
    return response.data;
};

export const register = async (userData: UserCreate) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
};
