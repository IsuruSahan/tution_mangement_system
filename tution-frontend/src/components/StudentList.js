import React, { useState, useEffect } from 'react'; // Added useEffect
import axios from 'axios';
import { Container, Spinner, Alert, Card, Table, Form, Row, Col, Badge, Button, Modal } from 'react-bootstrap';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';

function StudentList({ refreshKey, onListRefresh }) {
    // --- Student State ---
    const [students, setStudents] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Filter State ---
    const [gradeFilter, setGradeFilter] = useState('All');
    const [locationFilter, setLocationFilter] = useState('All');

    // --- Location State ---
    const [locations, setLocations] = useState([]);
    const [locationLoading, setLocationLoading] = useState(true);

    // --- Modal State ---
    const [showModal, setShowModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);

    // --- Fetch Students (Runs when refreshKey changes) ---
    useEffect(() => {
        const fetchStudents = async () => {
            setLoading(true); 
            setError(null);
            try {
                const response = await axios.get('http://localhost:5000/api/students');
                setStudents(response.data); 
                setLoading(false);
            } catch (err) {
                setError('Error fetching students. Please try again.');
                console.error(err);
                setLoading(false);
            }
        };
        fetchStudents();
    }, [refreshKey]);

    // --- NEW: Fetch Locations (Runs once on load) ---
    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/locations');
                setLocations(res.data);
                setLocationLoading(false);
            } catch (err) {
                console.error("Failed to fetch locations", err);
                setLocationLoading(false);
                // Don't set main error, just log it. Filters will just be empty.
            }
        };
        fetchLocations();
    }, []); // Empty array, runs once

    // --- Filter logic (No Change) ---
    const filteredStudents = students.filter(student => {
        const gradeMatch = gradeFilter === 'All' || student.grade === gradeFilter;
        const locationMatch = locationFilter === 'All' || student.location === locationFilter;
        return gradeMatch && locationMatch;
    });

    // --- Modal Handlers (No Change) ---
    const handleEditClick = (student) => {
        setEditingStudent(student);
        setShowModal(true);
    };
    const handleCloseModal = () => {
        setShowModal(false);
        setEditingStudent(null);
    };
    const handleModalChange = (e) => {
        setEditingStudent({
            ...editingStudent,
            [e.target.name]: e.target.value
        });
    };
    const handleUpdateStudent = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.patch(
                `http://localhost:5000/api/students/${editingStudent._id}`, 
                editingStudent
            );
            setStudents(students.map(s => 
                s._id === editingStudent._id ? response.data : s
            ));
            handleCloseModal();
        } catch (err) {
            console.error("Error updating student", err);
            alert("Failed to update student.");
        }
    };
    const handleDeactivateClick = async (studentId) => {
        if (window.confirm('Are you sure you want to deactivate this student? Their payment history will be kept.')) {
            try {
                await axios.delete(`http://localhost:5000/api/students/${studentId}`);
                onListRefresh(); 
            } catch (err) {
                console.error("Error deactivating student", err);
                alert("Failed to deactivate student.");
            }
        }
    };

    // --- Render Logic ---
    if (loading) {
        return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
    }
    if (error) {
        return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;
    }

    return (
        <>
            <Card className="mt-4">
                <Card.Header>
                    <Card.Title as="h2" className="mb-0">Student List</Card.Title>
                </Card.Header>
                <Card.Body>
                    <Form className="mb-3">
                        <Row>
                            <Col md={4}>
                                {/* --- Grade Filter (No Change) --- */}
                                <Form.Group controlId="gradeFilter">
                                    <Form.Label>Filter by Grade</Form.Label>
                                    <Form.Select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
                                        <option value="All">All Grades</option>
                                        <option value="Grade 6">Grade 6</option>
                                        <option value="Grade 7">Grade 7</option>
                                        <option value="Grade 8">Grade 8</option>
                                        <option value="Grade 9">Grade 9</option>
                                        <option value="Grade 10">Grade 10</option>
                                        <option value="Grade 11">Grade 11</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                {/* --- MODIFIED: Location Filter --- */}
                                <Form.Group controlId="locationFilter">
                                    <Form.Label>Filter by Location</Form.Label>
                                    <Form.Select 
                                        value={locationFilter} 
                                        onChange={(e) => setLocationFilter(e.target.value)}
                                        disabled={locationLoading}
                                    >
                                        <option value="All">All Locations</option>
                                        {locationLoading ? (
                                            <option disabled>Loading...</option>
                                        ) : (
                                            locations.map(loc => (
                                                <option key={loc._id} value={loc.name}>
                                                    {loc.name}
                                                </option>
                                            ))
                                        )}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Form>

                    {/* --- Student Table (No Change) --- */}
                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                <th>Student Name</th>
                                <th>Grade</th>
                                <th>Location</th>
                                <th>Contact Phone</th>
                                <th>Parent's Name</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map(student => (
                                    <tr key={student._id}>
                                        <td>{student.name}</td>
                                        <td><Badge bg="primary">{student.grade}</Badge></td>
                                        <td><Badge bg="secondary">{student.location}</Badge></td>
                                        <td>{student.contactPhone || '-'}</td>
                                        <td>{student.parentName || '-'}</td>
                                        <td>
                                            <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleEditClick(student)}>
                                                <FaEdit />
                                            </Button>
                                            <Button variant="outline-danger" size="sm" onClick={() => handleDeactivateClick(student._id)}>
                                                <FaTrashAlt />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center">No students found matching filters.</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            {/* --- EDIT STUDENT MODAL --- */}
            <Modal show={showModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Student</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {editingStudent && (
                        <Form onSubmit={handleUpdateStudent}>
                            {/* ... Name and Grade fields (No Change) ... */}
                            <Form.Group className="mb-3" controlId="editName">
                                <Form.Label>Student Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="name"
                                    value={editingStudent.name}
                                    onChange={handleModalChange}
                                    required
                                />
                            </Form.Group>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="editGrade">
                                        <Form.Label>Grade</Form.Label>
                                        <Form.Select name="grade" value={editingStudent.grade} onChange={handleModalChange}>
                                            <option value="Grade 6">Grade 6</option>
                                            <option value="Grade 7">Grade 7</option>
                                            <option value="Grade 8">Grade 8</option>
                                            <option value="Grade 9">Grade 9</option>
                                            <option value="Grade 10">Grade 10</option>
                                            <option value="Grade 11">Grade 11</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    {/* --- MODIFIED: Modal Location Dropdown --- */}
                                    <Form.Group className="mb-3" controlId="editLocation">
                                        <Form.Label>Location</Form.Label>
                                        <Form.Select 
                                            name="location" 
                                            value={editingStudent.location} 
                                            onChange={handleModalChange}
                                            disabled={locationLoading}
                                        >
                                            {locationLoading ? (
                                                <option disabled>Loading...</option>
                                            ) : (
                                                locations.map(loc => (
                                                    <option key={loc._id} value={loc.name}>
                                                        {loc.name}
                                                    </option>
                                                ))
                                            )}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>

                            {/* ... Phone and Parent fields (No Change) ... */}
                            <Form.Group className="mb-3" controlId="editPhone">
                                <Form.Label>Contact Phone</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="contactPhone"
                                    value={editingStudent.contactPhone || ''}
                                    onChange={handleModalChange}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="editParent">
                                <Form.Label>Parent's Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="parentName"
                                    value={editingStudent.parentName || ''}
                                    onChange={handleModalChange}
                                />
                            </Form.Group>

                            <Button variant="primary" type="submit">
                                Save Changes
                            </Button>
                        </Form>
                    )}
                </Modal.Body>
            </Modal>
        </>
    );
}

export default StudentList;