import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner, Container } from 'react-bootstrap';

const PrivateRoute = ({ children }) => {
    const { token, loading } = useAuth();

    // While we are checking if the token is valid, show a spinner
    if (loading) {
        return (
            <Container className="text-center mt-5">
                <Spinner animation="border" variant="primary" />
            </Container>
        );
    }

    // If there is a token, show the page. If not, bounce to login.
    return token ? children : <Navigate to="/login" />;
};

export default PrivateRoute;