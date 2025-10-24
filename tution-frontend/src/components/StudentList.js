import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Spinner, Alert, Card, Table, Form, Row, Col, Badge, Button, Modal } from 'react-bootstrap';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';

function StudentList({ refreshKey, onListRefresh }) {
    // --- State ---
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // Use null for initial error state
    const [gradeFilter, setGradeFilter] = useState('All');
    const [locationFilter, setLocationFilter] = useState('All');
    const [locations, setLocations] = useState([]);
    const [locationLoading, setLocationLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);

    // --- Fetch Students (Uses Env Var) ---
    useEffect(() => {
        const fetchStudents = async () => {
            setLoading(true);
            setError(null); // Clear previous errors
            try {
                const apiUrl = process.env.REACT_APP_API_URL; // Get API URL
                if (!apiUrl) {
                    throw new Error("API URL is not configured. Check Vercel environment variables or local .env file.");
                }
                // Fetch only active students (backend GET /api/students should handle this)
                const response = await axios.get(`${apiUrl}/api/students`); // Use apiUrl
                setStudents(response.data);
            } catch (err) {
                 console.error("Error fetching students:", err);
                 setError(`Error fetching students: ${err.message}`); // Set user-friendly error
            } finally {
                 setLoading(false);
            }
        };
        fetchStudents();
        // Re-fetch students only when refreshKey changes
    }, [refreshKey]);

    // --- Fetch Locations (Uses Env Var) ---
    useEffect(() => {
        const fetchLocations = async () => {
             setLocationLoading(true);
             // Don't clear main error, maybe students loaded but locations failed
            try {
                const apiUrl = process.env.REACT_APP_API_URL; // Get API URL
                if (!apiUrl) {
                    throw new Error("API URL is not configured.");
                }
                const res = await axios.get(`${apiUrl}/api/locations`); // Use apiUrl
                setLocations(res.data);
            } catch (err) {
                 console.error("Failed to fetch locations:", err);
                 // Set a specific location error or append to main error if needed
                 setError(prev => prev ? `${prev} Failed to load locations.` : `Failed to load locations: ${err.message}`);
            } finally {
                 setLocationLoading(false);
            }
        };
        fetchLocations();
        // Run only once on component mount
    }, []);

    // --- Filter logic (Unchanged) ---
    const filteredStudents = students.filter(student => {
        const gradeMatch = gradeFilter === 'All' || student.grade === gradeFilter;
        const locationMatch = locationFilter === 'All' || student.location === locationFilter;
        return gradeMatch && locationMatch;
    });

    // --- Modal Handlers (Uses Env Var) ---
    const handleEditClick = (student) => { setEditingStudent(student); setShowModal(true); };
    const handleCloseModal = () => { setShowModal(false); setEditingStudent(null); };
    const handleModalChange = (e) => { setEditingStudent({ ...editingStudent, [e.target.name]: e.target.value }); };

    const handleUpdateStudent = async (e) => {
        e.preventDefault();
        if (!editingStudent) return; // Should not happen, but safety check

        try {
            const apiUrl = process.env.REACT_APP_API_URL; // Get API URL
            if (!apiUrl) {
                throw new Error("API URL is not configured.");
            }
            // Exclude fields that shouldn't be sent or modified
            const { _id, studentId, __v, createdAt, updatedAt, ...updateData } = editingStudent;
            const response = await axios.patch(`${apiUrl}/api/students/${_id}`, updateData); // Use apiUrl

            // Update state immutably
            setStudents(currentStudents =>
                currentStudents.map(s => (s._id === editingStudent._id ? response.data : s))
            );
            handleCloseModal(); // Close modal on success
        } catch (err) {
             console.error("Error updating student:", err);
             // Show specific backend error if available, otherwise generic
             alert(`Failed to update student: ${err.response?.data?.message || err.message}`);
        }
    };

    const handleDeactivateClick = async (studentMongoId) => { // Use MongoDB _id
        if (window.confirm('Are you sure you want to deactivate this student?')) {
            try {
                 const apiUrl = process.env.REACT_APP_API_URL; // Get API URL
                 if (!apiUrl) {
                    throw new Error("API URL is not configured.");
                 }
                await axios.delete(`${apiUrl}/api/students/${studentMongoId}`); // Use apiUrl and MongoDB _id
                onListRefresh(); // Refresh list via parent component prop
            } catch (err) {
                 console.error("Error deactivating student:", err);
                 alert(`Failed to deactivate student: ${err.response?.data?.message || err.message}`);
            }
        }
    };

    // --- Render Logic ---
    if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>; // Restore animation
    // Show main error if student loading failed critically
    if (error && students.length === 0 && !loading) {
        return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;
    }


    return (
        <>
            <Card className="mt-4">
                <Card.Header><Card.Title as="h2" className="mb-0">Student List</Card.Title></Card.Header>
                <Card.Body>
                     {/* Show non-critical location loading error here */}
                     {error && students.length > 0 && <Alert variant="warning">{error.includes("locations") ? "Failed to load location filters." : error }</Alert>}
                    {/* --- Filters --- */}
                    <Form className="mb-3">
                        <Row>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Grade</Form.Label>
                                    <Form.Select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
                                        <option value="All">All Grades</option> {/* Restore text */}
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
                                <Form.Group>
                                    <Form.Label>Location</Form.Label>
                                    <Form.Select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} disabled={locationLoading}>
                                        <option value="All">All Locations</option> {/* Restore text */}
                                        {locationLoading ? (<option disabled>Loading...</option>) : ( // Restore text
                                            locations.map(loc => (<option key={loc._id} value={loc.name}>{loc.name}</option>))
                                        )}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Form>

                    {/* --- Student Table --- */}
                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                <th>Student ID</th>
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
                                        <td>{student.studentId || 'N/A'}</td> {/* Handle potentially missing ID */}
                                        <td>{student.name}</td>
                                        <td><Badge bg="primary">{student.grade}</Badge></td>
                                        <td><Badge bg="secondary">{student.location}</Badge></td>
                                        <td>{student.contactPhone || '-'}</td>
                                        <td>{student.parentName || '-'}</td>
                                        <td> {/* Actions */}
                                            <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleEditClick(student)}> <FaEdit /> </Button>
                                            <Button variant="outline-danger" size="sm" onClick={() => handleDeactivateClick(student._id)}> <FaTrashAlt /> </Button> {/* Use MongoDB _id */}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="text-center">No students found matching filters.</td> {/* Restore text */}
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            {/* --- EDIT STUDENT MODAL --- */}
            <Modal show={showModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton> <Modal.Title>Edit Student</Modal.Title> </Modal.Header>
                <Modal.Body>
                    {editingStudent && (
                        <Form onSubmit={handleUpdateStudent}>
                            <Form.Group className="mb-3" controlId="editStudentId">
                                <Form.Label>Student ID</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={editingStudent.studentId || 'N/A'} // Show N/A if missing
                                    readOnly
                                    disabled
                                />
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="editName">
                                <Form.Label>Name</Form.Label> {/* Restore text */}
                                <Form.Control type="text" name="name" value={editingStudent.name} onChange={handleModalChange} required />
                            </Form.Group>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Grade</Form.Label>
                                        <Form.Select name="grade" value={editingStudent.grade} onChange={handleModalChange}>
                                            {/* Restore full text */}
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
                                    <Form.Group className="mb-3">
                                        <Form.Label>Location</Form.Label>
                                        <Form.Select name="location" value={editingStudent.location} onChange={handleModalChange} disabled={locationLoading}>
                                            {locationLoading ? (<option disabled>Loading...</option>) : ( // Restore text
                                                locations.map(loc => (<option key={loc._id} value={loc.name}>{loc.name}</option>))
                                            )}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Form.Group className="mb-3" controlId="editPhone">
                                <Form.Label>Phone</Form.Label> {/* Restore text */}
                                <Form.Control type="text" name="contactPhone" value={editingStudent.contactPhone || ''} onChange={handleModalChange} />
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="editParent">
                                <Form.Label>Parent</Form.Label> {/* Restore text */}
                                <Form.Control type="text" name="parentName" value={editingStudent.parentName || ''} onChange={handleModalChange} />
                            </Form.Group>
                            <Button variant="primary" type="submit"> Save Changes </Button> {/* Restore text */}
                        </Form>
                    )}
                </Modal.Body>
            </Modal>
        </>
    );
}

export default StudentList;