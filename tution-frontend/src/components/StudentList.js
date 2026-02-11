import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Container, Spinner, Alert, Card, Table, Form, Row, Col, Badge, Button, Modal } from 'react-bootstrap';
import { FaEdit, FaTrashAlt, FaQrcode } from 'react-icons/fa';
import QRCode from "react-qr-code";
import { toJpeg } from 'html-to-image';
import { useAuth } from '../context/AuthContext'; // Import Auth

function StudentList({ refreshKey, onListRefresh }) {
    const { teacher } = useAuth(); // Access global teacher state
    
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
    const [showQrModal, setShowQrModal] = useState(false);
    const [qrStudent, setQrStudent] = useState(null);

    const qrCodeRef = useRef(null);
    const apiUrl = process.env.REACT_APP_API_URL;

    // --- Fetch Students (Securely tagged by Teacher via Axios Interceptor) ---
    useEffect(() => {
        const fetchStudents = async () => {
            setLoading(true); 
            setError(null); 
            try { 
                const response = await axios.get(`${apiUrl}/api/students`); 
                setStudents(response.data); 
            } catch (err) { 
                console.error("Error fetching students:", err); 
                setError(`Error: ${err.response?.data?.message || err.message}`); 
            } finally { 
                setLoading(false); 
            }
        };
        if (teacher) fetchStudents(); // Only fetch if teacher is logged in
    }, [refreshKey, teacher, apiUrl]);

    // --- Fetch Locations (Securely tagged by Teacher) ---
    useEffect(() => {
        const fetchLocations = async () => {
            setLocationLoading(true); 
            try { 
                const res = await axios.get(`${apiUrl}/api/locations`); 
                setLocations(res.data); 
            } catch (err) { 
                console.error("Failed locations:", err); 
            } finally { 
                setLocationLoading(false); 
            }
        };
        if (teacher) fetchLocations();
    }, [teacher, apiUrl]);

    // --- Filter logic ---
    const filteredStudents = students.filter(student => { 
        const gm = gradeFilter === 'All' || student.grade === gradeFilter; 
        const lm = locationFilter === 'All' || student.location === locationFilter; 
        return gm && lm; 
    });

    // --- Action Handlers ---
    const handleEditClick = (student) => { setEditingStudent(student); setShowModal(true); };
    const handleCloseModal = () => { setShowModal(false); setEditingStudent(null); };
    const handleModalChange = (e) => { setEditingStudent({ ...editingStudent, [e.target.name]: e.target.value }); };
    
    const handleUpdateStudent = async (e) => { 
        e.preventDefault(); 
        if (!editingStudent) return; 
        try { 
            const { _id, studentId, teacherId, __v, createdAt, updatedAt, ...updateData } = editingStudent; 
            const res = await axios.patch(`${apiUrl}/api/students/${_id}`, updateData); 
            setStudents(s => s.map(st => (st._id === editingStudent._id ? res.data : st))); 
            handleCloseModal(); 
        } catch (err) { 
            alert(`Update failed: ${err.response?.data?.message || err.message}`); 
        } 
    };

    const handleDeactivateClick = async (studentMongoId) => { 
        if (window.confirm('Are you sure you want to deactivate this student?')) { 
            try { 
                await axios.delete(`${apiUrl}/api/students/${studentMongoId}`); 
                onListRefresh(); 
            } catch (err) { 
                alert(`Deactivation failed: ${err.response?.data?.message || err.message}`); 
            } 
        } 
    };

    const handleDownload = () => {
        if (!qrCodeRef.current) return;
        toJpeg(qrCodeRef.current, { cacheBust: true, quality: 0.98, backgroundColor: 'white' })
            .then((dataUrl) => {
                const link = document.createElement('a');
                link.download = `${qrStudent.name}-${qrStudent.studentId}-ID.jpg`;
                link.href = dataUrl;
                link.click();
            })
            .catch((err) => alert('Could not download image.'));
    };

    if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;

    return (
        <>
            <Card className="shadow-sm">
                <Card.Header className="bg-white py-3">
                    <Card.Title as="h4" className="mb-0">Active Students</Card.Title>
                </Card.Header>
                <Card.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    
                    <Form className="mb-4"> 
                        <Row> 
                            <Col md={6} lg={4}> 
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold">Filter by Grade</Form.Label> 
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
                            <Col md={6} lg={4}> 
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold">Filter by Location</Form.Label> 
                                    <Form.Select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} disabled={locationLoading}> 
                                        <option value="All">All Locations</option> 
                                        {locations.map(loc => (<option key={loc._id} value={loc.name}>{loc.name}</option>))} 
                                    </Form.Select> 
                                </Form.Group> 
                            </Col> 
                        </Row> 
                    </Form>

                    <Table striped bordered hover responsive>
                        <thead className="table-dark">
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Grade</th>
                                <th>Location</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map(student => (
                                    <tr key={student._id}>
                                        <td>{student.studentId}</td>
                                        <td>{student.name}</td>
                                        <td><Badge bg="primary">{student.grade}</Badge></td>
                                        <td><Badge bg="secondary">{student.location}</Badge></td>
                                        <td>
                                            <Button variant="outline-dark" size="sm" className="me-2" onClick={() => { setQrStudent(student); setShowQrModal(true); }}><FaQrcode /></Button>
                                            <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleEditClick(student)}><FaEdit /></Button>
                                            <Button variant="outline-danger" size="sm" onClick={() => handleDeactivateClick(student._id)}><FaTrashAlt /></Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="5" className="text-center py-4">No students found.</td></tr>
                            )}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            {/* Edit Modal */}
            <Modal show={showModal} onHide={handleCloseModal} centered>
                 <Modal.Header closeButton><Modal.Title>Update Student Profile</Modal.Title></Modal.Header>
                 <Modal.Body>
                    {editingStudent && (
                        <Form onSubmit={handleUpdateStudent}>
                            <Form.Group className="mb-3"><Form.Label>Name</Form.Label><Form.Control type="text" name="name" value={editingStudent.name} onChange={handleModalChange} required /></Form.Group>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3"><Form.Label>Grade</Form.Label>
                                        <Form.Select name="grade" value={editingStudent.grade} onChange={handleModalChange}>
                                            <option value="Grade 6">Grade 6</option><option value="Grade 7">Grade 7</option>
                                            <option value="Grade 8">Grade 8</option><option value="Grade 9">Grade 9</option>
                                            <option value="Grade 10">Grade 10</option><option value="Grade 11">Grade 11</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3"><Form.Label>Location</Form.Label>
                                        <Form.Select name="location" value={editingStudent.location} onChange={handleModalChange}>
                                            {locations.map(loc => (<option key={loc._id} value={loc.name}>{loc.name}</option>))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Form.Group className="mb-3"><Form.Label>Parent's Name</Form.Label><Form.Control type="text" name="parentName" value={editingStudent.parentName || ''} onChange={handleModalChange} /></Form.Group>
                            <div className="d-grid"><Button variant="primary" type="submit">Update Information</Button></div>
                        </Form>
                    )}
                 </Modal.Body>
            </Modal>

            {/* QR Modal */}
            <Modal show={showQrModal} onHide={() => setShowQrModal(false)} centered>
                <Modal.Header closeButton><Modal.Title>Identity QR Code</Modal.Title></Modal.Header>
                <Modal.Body className="text-center">
                    <div ref={qrCodeRef} className="p-4 border rounded bg-white d-inline-block">
                        <QRCode value={qrStudent?.studentId || ""} size={200} />
                        <h5 className="mt-3 mb-0">{qrStudent?.name}</h5>
                        <p className="text-muted small mb-0">Student ID: {qrStudent?.studentId}</p>
                    </div>
                    <div className="mt-4">
                        <Button variant="success" onClick={handleDownload} className="w-100">Download ID Card Image</Button>
                    </div>
                </Modal.Body>
            </Modal>
        </>
    );
}

export default StudentList;