import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [teacher, setTeacher] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    const apiUrl = process.env.REACT_APP_API_URL;

    // We wrap fetchTeacher in useCallback so it doesn't change on every render
    const fetchTeacher = useCallback(async () => {
        if (!token || !apiUrl) {
            setLoading(false);
            return;
        }
        try {
            const res = await axios.get(`${apiUrl}/api/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTeacher(res.data);
        } catch (err) {
            console.error("Auth Error:", err);
            localStorage.removeItem('token');
            setToken(null);
        } finally {
            setLoading(false);
        }
    }, [token, apiUrl]);

    useEffect(() => {
        fetchTeacher();
    }, [fetchTeacher]); // Dependency is now stable

    const login = (newToken, teacherData) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setTeacher(teacherData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setTeacher(null);
    };

    return (
        <AuthContext.Provider value={{ teacher, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);