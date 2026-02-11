import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Container, Spinner } from 'react-bootstrap';

const PrivateRoute = ({ children }) => {
    const { token, loading } = useAuth();

    // 1. If the app is still verifying the teacher, show a loading spinner
    // This stops the app from redirecting to /login accidentally
    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                <Spinner animation="border" variant="primary" />
            </Container>
        );
    }

    // 2. If loading is done and there is NO token, THEN redirect to login
    return token ? children : <Navigate to="/login" />;
};

export default PrivateRoute;