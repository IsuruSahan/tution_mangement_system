import React, { useState } from 'react';
import { Container, Form, Button, Card, Alert, Spinner, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

function RegisterPage() {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        instituteName: '',
        location: '' // New field for base city
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            return setError('Passwords do not match.');
        }

        setLoading(true);

        try {
            const apiUrl = process.env.REACT_APP_API_URL;
            // Sending the updated object with firstName, lastName, and location
            const res = await axios.post(`${apiUrl}/api/auth/register`, {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                password: formData.password,
                instituteName: formData.instituteName,
                location: formData.location
            });
            
            login(res.data.token, res.data.teacher);
            navigate('/'); 
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Try a different email.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="d-flex align-items-center justify-content-center py-5" style={{ minHeight: '90vh' }}>
            <Card className="shadow-sm border-0" style={{ maxWidth: '600px', width: '100%' }}>
                <Card.Body className="p-4 p-md-5">
                    <div className="text-center mb-4">
                        <h2 className="fw-bold">Teacher Registration</h2>
                        <p className="text-muted">Start managing your tuition classes today</p>
                    </div>

                    {error && <Alert variant="danger">{error}</Alert>}

                    <Form onSubmit={handleSubmit}>
                        {/* Row 1: First Name and Last Name */}
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold small">First Name</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        name="firstName"
                                        placeholder="Isuru" 
                                        value={formData.firstName} 
                                        onChange={handleChange} 
                                        required 
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold small">Last Name</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        name="lastName"
                                        placeholder="Kumarasiri" 
                                        value={formData.lastName} 
                                        onChange={handleChange} 
                                        required 
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* Row 2: Institute and Location */}
                        <Row>
                            <Col md={7}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold small">Institute Name</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        name="instituteName"
                                        placeholder="e.g. Sahan's Science Academy" 
                                        value={formData.instituteName} 
                                        onChange={handleChange} 
                                        required 
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={5}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold small">Base City</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        name="location"
                                        placeholder="e.g. Kadawatha" 
                                        value={formData.location} 
                                        onChange={handleChange} 
                                        required 
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold small">Email Address</Form.Label>
                            <Form.Control 
                                type="email" 
                                name="email"
                                placeholder="teacher@example.com" 
                                value={formData.email} 
                                onChange={handleChange} 
                                required 
                            />
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold small">Password</Form.Label>
                                    <Form.Control 
                                        type="password" 
                                        name="password"
                                        placeholder="Min 6 characters" 
                                        value={formData.password} 
                                        onChange={handleChange} 
                                        required 
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold small">Confirm Password</Form.Label>
                                    <Form.Control 
                                        type="password" 
                                        name="confirmPassword"
                                        placeholder="Repeat password" 
                                        value={formData.confirmPassword} 
                                        onChange={handleChange} 
                                        required 
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Button variant="primary" type="submit" className="w-100 py-2 fw-bold mb-3 shadow-sm" disabled={loading}>
                            {loading ? <Spinner size="sm" /> : 'Create My Account'}
                        </Button>

                        <div className="text-center">
                            <small className="text-muted">
                                Already registered? <Link to="/login" className="text-decoration-none fw-bold">Login here</Link>
                            </small>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
}

export default RegisterPage;