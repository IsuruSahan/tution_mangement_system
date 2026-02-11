import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [teacher, setTeacher] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    // Whenever the token changes, update axios defaults and localStorage
    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);
            // This ensures EVERY axios request automatically includes the Bearer token
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            fetchTeacher();
        } else {
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            setTeacher(null);
            setLoading(false);
        }
    }, [token]);

    const fetchTeacher = async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/me`);
            setTeacher(res.data);
        } catch (err) {
            console.error("Session expired or invalid");
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = (newToken, teacherData) => {
        setToken(newToken);
        setTeacher(teacherData);
    };

    const logout = () => {
        setToken(null);
        setTeacher(null);
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ teacher, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);