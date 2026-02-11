import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [teacher, setTeacher] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    const apiUrl = process.env.REACT_APP_API_URL;

    // --- 1. AXIOS INTERCEPTOR ---
    // This is the magic fix. It attaches the token to EVERY outgoing request automatically.
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]);

    // --- 2. FETCH TEACHER DATA ---
    const fetchTeacher = useCallback(async () => {
        // If there's no token, we can't be logged in.
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            // No need to manually add headers here anymore because of the interceptor above!
            const res = await axios.get(`${apiUrl}/api/auth/me`);
            setTeacher(res.data);
        } catch (err) {
            console.error("Session verification failed:", err.response?.data?.message || err.message);
            // If the token is expired or fake, clean up.
            logout(); 
        } finally {
            setLoading(false);
        }
    }, [token, apiUrl]);

    useEffect(() => {
        fetchTeacher();
    }, [fetchTeacher]);

    // --- 3. AUTH ACTIONS ---
    const login = (newToken, teacherData) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setTeacher(teacherData);
        setLoading(false);
    };

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setToken(null);
        setTeacher(null);
        setLoading(false);
    }, []);

    return (
        <AuthContext.Provider value={{ teacher, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);