import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Button, Row, Col, Alert, Card, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

function AddStudent({ onStudentAdded }) {
    const { teacher } = useAuth(); // Access global teacher state

    // --- Form Fields ---
    const [name, setName] = useState('');
    const [grade, setGrade] = useState('Grade 6');
    const [location, setLocation] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [parentName, setParentName] = useState('');

    // --- Component State ---
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const apiUrl = process.env.REACT_APP_API_URL;

    // --- Fetch teacher-specific locations on mount ---
    useEffect(() => {
        const fetchLocations = async () => {
            setLocationLoading(true);
            try {
                const res = await axios.get(`${apiUrl}/api/locations`);
                setLocations(res.data);
                
                // Set default location if list isn't empty
                if (res.data.length > 0) {
                    setLocation(res.data[0].name);
                }
            } catch (err) {
                console.error("Failed to fetch locations:", err);
                setError("Could not load your locations. Please check your settings.");
            } finally {
                setLocationLoading(false);
            }
        };

        if (teacher) fetchLocations();
    }, [teacher, apiUrl]);

    // --- Submit Handler ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        if (!name || !grade || !location) {
            setLoading(false);
            return setError('Name, Grade, and Location are required.');
        }

        const newStudentData = { name, grade, location, contactPhone, parentName };

        try {
            // Because of the AuthContext, this POST request includes the Teacher's Token
            const response = await axios.post(`${apiUrl}/api/students`, newStudentData);

            setMessage(`Success! Student "${response.data.name}" added with ID: ${response.data.studentId}`);

            // Reset Form
            setName('');
            setGrade('Grade 6');
            setContactPhone('');
            setParentName('');
            if (locations.length > 0) setLocation(locations[0].name);

            // Refresh the sibling list component
            if (onStudentAdded) onStudentAdded();

        } catch (err) {
            console.error("Error adding student:", err);
            setError(`Failed to add student: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="shadow-sm border-0">
            <Card.Body className="p-4">
                <Card.Title as="h4" className="mb-4">Enroll New Student</Card.Title>

                {message && <Alert variant="success" dismissible onClose={() => setMessage('')}>{message}</Alert>}
                {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">Student Full Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Enter student's name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">Grade / Batch</Form.Label>
                                <Form.Select value={grade} onChange={(e) => setGrade(e.target.value)}>
                                    <option value="Grade 6">Grade 6</option>
                                    <option value="Grade 7">Grade 7</option>
                                    <option value="Grade 8">Grade 8</option>
                                    <option value="Grade 9">Grade 9</option>
                                    <option value="Grade 10">Grade 10</option>
                                    <option value="Grade 11">Grade 11</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">Class Location</Form.Label>
                                <Form.Select
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    disabled={locationLoading}
                                    required
                                >
                                    {locationLoading ? (
                                        <option>Loading locations...</option>
                                    ) : locations.length > 0 ? (
                                        <>
                                            <option value="">-- Select Location --</option>
                                            {locations.map(loc => (
                                                <option key={loc._id} value={loc.name}>{loc.name}</option>
                                            ))}
                                        </>
                                    ) : (
                                        <option value="">No locations found. Add one in settings!</option>
                                    )}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">Contact Phone</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g. 0771234567"
                                    value={contactPhone}
                                    onChange={(e) => setContactPhone(e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-4">
                                <Form.Label className="fw-bold">Parent / Guardian Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Enter parent's name"
                                    value={parentName}
                                    onChange={(e) => setParentName(e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <div className="d-grid">
                        <Button variant="primary" type="submit" size="lg" disabled={loading || locationLoading}>
                            {loading ? <><Spinner size="sm" className="me-2" /> Saving...</> : 'Register Student'}
                        </Button>
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );
}

export default AddStudent;