import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [teacher, setTeacher] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    const apiUrl = process.env.REACT_APP_API_URL;

    // --- 1. DEFINE LOGOUT FIRST ---
    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setToken(null);
        setTeacher(null);
        setLoading(false);
        // Clear global headers
        delete axios.defaults.headers.common['Authorization'];
    }, []);

    // --- 2. AXIOS INTERCEPTOR ---
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]);

    // --- 3. FETCH TEACHER DATA ---
    const fetchTeacher = useCallback(async () => {
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const res = await axios.get(`${apiUrl}/api/auth/me`);
            setTeacher(res.data);
        } catch (err) {
            console.error("Session verification failed:", err.response?.data?.message || err.message);
            logout(); // Now listed in dependencies below
        } finally {
            setLoading(false);
        }
    }, [token, apiUrl, logout]); // Added logout here to satisfy ESLint

    useEffect(() => {
        fetchTeacher();
    }, [fetchTeacher]);

    // --- 4. LOGIN ACTION ---
    const login = (newToken, teacherData) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setTeacher(teacherData);
        setLoading(false);
    };

    return (
        <AuthContext.Provider value={{ teacher, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);