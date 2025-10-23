import React, { useState, useEffect } from 'react'; // Added useEffect
import axios from 'axios';
import { Form, Button, Row, Col, Alert, Card } from 'react-bootstrap';

function AddStudent({ onStudentAdded }) {
    // --- Form Fields ---
    const [name, setName] = useState('');
    const [grade, setGrade] = useState('Grade 6');
    const [location, setLocation] = useState(''); // Default is now empty
    const [contactPhone, setContactPhone] = useState('');
    const [parentName, setParentName] = useState('');

    // --- State for Locations Dropdown ---
    const [locations, setLocations] = useState([]);
    const [locationLoading, setLocationLoading] = useState(true);

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // --- NEW: Fetch locations when component loads ---
    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/locations');
                setLocations(res.data);
                // Set the default location state to the first location in the list
                if (res.data.length > 0) {
                    setLocation(res.data[0].name);
                }
                setLocationLoading(false);
            } catch (err) {
                console.error("Failed to fetch locations", err);
                setError("Failed to load locations list for the form.");
                setLocationLoading(false);
            }
        };
        fetchLocations();
    }, []); // Empty array means this runs once on mount

    const handleSubmit = async (e) => {
        e.preventDefault(); 
        setMessage('');
        setError('');

        if (!name || !grade || !location) {
            return setError('Name, Grade, and Location are required.');
        }

        const newStudent = { name, grade, location, contactPhone, parentName };

        try {
            const response = await axios.post('http://localhost:5000/api/students', newStudent);
            
            setMessage(`Success! Student "${response.data.name}" added.`);
            
            // Clear the form fields
            setName('');
            setGrade('Grade 6');
            // --- MODIFIED: Reset location to the first in the list ---
            setLocation(locations.length > 0 ? locations[0].name : '');
            setContactPhone('');
            setParentName('');

            if (onStudentAdded) {
                onStudentAdded();
            }

        } catch (err) {
            setError('Error adding student. Please try again.');
            console.error(err);
        }
    };

    return (
        <Card className="mb-4">
            <Card.Body>
                <Card.Title>Add New Student</Card.Title>
                
                {message && <Alert variant="success">{message}</Alert>}
                {error && <Alert variant="danger">{error}</Alert>}
                
                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col md={6}>
                            {/* --- Student Name (No Change) --- */}
                            <Form.Group className="mb-3" controlId="formStudentName">
                                <Form.Label>Student Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            {/* --- Grade (No Change) --- */}
                            <Form.Group className="mb-3" controlId="formGrade">
                                <Form.Label>Grade</Form.Label>
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
                            {/* --- MODIFIED: Location Dropdown --- */}
                            <Form.Group className="mb-3" controlId="formLocation">
                                <Form.Label>Location</Form.Label>
                                <Form.Select 
                                    value={location} 
                                    onChange={(e) => setLocation(e.target.value)}
                                    disabled={locationLoading}
                                >
                                    {locationLoading ? (
                                        <option>Loading locations...</option>
                                    ) : (
                                        locations.length > 0 ? (
                                            locations.map(loc => (
                                                <option key={loc._id} value={loc.name}>
                                                    {loc.name}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="">No locations configured</option>
                                        )
                                    )}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            {/* --- Contact Phone (No Change) --- */}
                            <Form.Group className="mb-3" controlId="formContactPhone">
                                <Form.Label>Contact Phone</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={contactPhone}
                                    onChange={(e) => setContactPhone(e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            {/* --- Parent's Name (No Change) --- */}
                            <Form.Group className="mb-3" controlId="formParentName">
                                <Form.Label>Parent's Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={parentName}
                                    onChange={(e) => setParentName(e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    
                    <Button variant="primary" type="submit" disabled={locationLoading}>
                        Add Student
                    </Button>
                </Form>
            </Card.Body>
        </Card>
    );
}

export default AddStudent;