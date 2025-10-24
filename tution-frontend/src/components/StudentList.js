import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Spinner, Alert, Card, Table, Form, Row, Col, Badge, Button, Modal } from 'react-bootstrap';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';

function StudentList({ refreshKey, onListRefresh }) {
    // --- State ---
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [gradeFilter, setGradeFilter] = useState('All');
    const [locationFilter, setLocationFilter] = useState('All');
    const [locations, setLocations] = useState([]);
    const [locationLoading, setLocationLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);

    // --- Fetch Students ---
    useEffect(() => {
        const fetchStudents = async () => { /* ... unchanged ... */
            setLoading(true); setError(null); try { const response = await axios.get('http://localhost:5000/api/students'); setStudents(response.data); setLoading(false); } catch (err) { setError('Error fetching students.'); console.error(err); setLoading(false); }
        };
        fetchStudents();
    }, [refreshKey]);

    // --- Fetch Locations ---
    useEffect(() => {
        const fetchLocations = async () => { /* ... unchanged ... */
            try { const res = await axios.get('http://localhost:5000/api/locations'); setLocations(res.data); setLocationLoading(false); } catch (err) { console.error("Failed locations", err); setLocationLoading(false); }
        };
        fetchLocations();
    }, []);

    // --- Filter logic ---
    const filteredStudents = students.filter(student => { /* ... unchanged ... */
        const gradeMatch = gradeFilter === 'All' || student.grade === gradeFilter; const locationMatch = locationFilter === 'All' || student.location === locationFilter; return gradeMatch && locationMatch;
    });

    // --- Modal Handlers (Minor change to not send studentId) ---
    const handleEditClick = (student) => { setEditingStudent(student); setShowModal(true); };
    const handleCloseModal = () => { setShowModal(false); setEditingStudent(null); };
    const handleModalChange = (e) => { setEditingStudent({ ...editingStudent, [e.target.name]: e.target.value }); };
    const handleUpdateStudent = async (e) => {
        e.preventDefault();
        try {
            // Exclude _id and studentId from the data sent for update
            const { _id, studentId, __v, createdAt, updatedAt, ...updateData } = editingStudent;
            const response = await axios.patch(`http://localhost:5000/api/students/${_id}`, updateData);
            setStudents(students.map(s => s._id === editingStudent._id ? response.data : s));
            handleCloseModal();
        } catch (err) { console.error("Error updating", err); alert("Failed update."); }
    };
    const handleDeactivateClick = async (studentId) => { /* ... unchanged ... */
        if (window.confirm('Deactivate?')) { try { await axios.delete(`http://localhost:5000/api/students/${studentId}`); onListRefresh(); } catch (err) { console.error("Error deactivate", err); alert("Failed deactivate."); } }
    };

    // --- Render Logic ---
    if (loading) return <Container className="text-center mt-5"><Spinner /></Container>;
    if (error) return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;

    return (
        <>
            <Card className="mt-4">
                <Card.Header><Card.Title as="h2" className="mb-0">Student List</Card.Title></Card.Header>
                <Card.Body>
                    {/* --- Filters (Unchanged) --- */}
                    <Form className="mb-3"> <Row> <Col md={4}> <Form.Group><Form.Label>Grade</Form.Label> <Form.Select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}> <option value="All">All</option> <option value="Grade 6">G6</option> <option value="Grade 7">G7</option> <option value="Grade 8">G8</option> <option value="Grade 9">G9</option> <option value="Grade 10">G10</option> <option value="Grade 11">G11</option> </Form.Select> </Form.Group> </Col> <Col md={4}> <Form.Group><Form.Label>Location</Form.Label> <Form.Select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} disabled={locationLoading}> <option value="All">All</option> {locationLoading ? (<option>...</option>) : ( locations.map(loc => (<option key={loc._id} value={loc.name}>{loc.name}</option>)) )} </Form.Select> </Form.Group> </Col> </Row> </Form>

                    {/* --- Student Table (MODIFIED) --- */}
                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                <th>Student ID</th> {/* <-- NEW COLUMN */}
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
                                        <td>{student.studentId}</td> {/* <-- NEW CELL */}
                                        <td>{student.name}</td>
                                        <td><Badge bg="primary">{student.grade}</Badge></td>
                                        <td><Badge bg="secondary">{student.location}</Badge></td>
                                        <td>{student.contactPhone || '-'}</td>
                                        <td>{student.parentName || '-'}</td>
                                        <td> {/* Actions */}
                                            <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleEditClick(student)}> <FaEdit /> </Button>
                                            <Button variant="outline-danger" size="sm" onClick={() => handleDeactivateClick(student._id)}> <FaTrashAlt /> </Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr> <td colSpan="7" className="text-center">No students found.</td> </tr> // Increased colspan
                            )}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            {/* --- EDIT STUDENT MODAL (MODIFIED) --- */}
            <Modal show={showModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton> <Modal.Title>Edit Student</Modal.Title> </Modal.Header>
                <Modal.Body>
                    {editingStudent && (
                        <Form onSubmit={handleUpdateStudent}>
                            {/* --- NEW: Display Student ID (Read Only) --- */}
                            <Form.Group className="mb-3" controlId="editStudentId">
                                <Form.Label>Student ID</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={editingStudent.studentId}
                                    readOnly // Make it non-editable
                                    disabled
                                />
                            </Form.Group>
                            {/* --- End New Field --- */}

                            <Form.Group className="mb-3" controlId="editName"> <Form.Label>Name</Form.Label> <Form.Control type="text" name="name" value={editingStudent.name} onChange={handleModalChange} required /> </Form.Group>
                            <Row>
                                <Col md={6}> <Form.Group className="mb-3"><Form.Label>Grade</Form.Label> <Form.Select name="grade" value={editingStudent.grade} onChange={handleModalChange}> <option value="Grade 6">G6</option> <option value="Grade 7">G7</option> <option value="Grade 8">G8</option> <option value="Grade 9">G9</option> <option value="Grade 10">G10</option> <option value="Grade 11">G11</option> </Form.Select> </Form.Group> </Col>
                                <Col md={6}> <Form.Group className="mb-3"><Form.Label>Location</Form.Label> <Form.Select name="location" value={editingStudent.location} onChange={handleModalChange} disabled={locationLoading}> {locationLoading ? (<option>...</option>) : ( locations.map(loc => (<option key={loc._id} value={loc.name}>{loc.name}</option>)) )} </Form.Select> </Form.Group> </Col>
                            </Row>
                            <Form.Group className="mb-3" controlId="editPhone"> <Form.Label>Phone</Form.Label> <Form.Control type="text" name="contactPhone" value={editingStudent.contactPhone || ''} onChange={handleModalChange} /> </Form.Group>
                            <Form.Group className="mb-3" controlId="editParent"> <Form.Label>Parent</Form.Label> <Form.Control type="text" name="parentName" value={editingStudent.parentName || ''} onChange={handleModalChange} /> </Form.Group>
                            <Button variant="primary" type="submit"> Save Changes </Button>
                        </Form>
                    )}
                </Modal.Body>
            </Modal>
        </>
    );
}

export default StudentList;