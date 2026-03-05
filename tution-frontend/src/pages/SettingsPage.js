import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Form, Button, ListGroup, Spinner, Alert, CloseButton } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { FaUserEdit, FaMapMarkerAlt, FaClinicMedical, FaExclamationTriangle } from 'react-icons/fa';

function SettingsPage() {
    const { teacher, login } = useAuth(); // login function helps update the local state after saving
    
    // --- State for Profile ---
    const [profileData, setProfileData] = useState({
        firstName: teacher?.firstName || '',
        lastName: teacher?.lastName || '',
        instituteName: teacher?.instituteName || '',
        location: teacher?.location || ''
    });
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileMessage, setProfileMessage] = useState('');
    const [profileError, setProfileError] = useState('');

    // --- State for Locations ---
    const [locations, setLocations] = useState([]);
    const [loadingLocations, setLoadingLocations] = useState(true);
    const [locationError, setLocationError] = useState('');
    const [newLocationName, setNewLocationName] = useState('');
    const [formError, setFormError] = useState('');

    // --- State for Data Resets ---
    const [resettingFinance, setResettingFinance] = useState(false);
    const [resetFinanceMessage, setResetFinanceMessage] = useState('');
    const [resetFinanceError, setResetFinanceError] = useState('');

    const [resettingAttendance, setResettingAttendance] = useState(false);
    const [resetAttendanceMessage, setResetAttendanceMessage] = useState('');
    const [resetAttendanceError, setResetAttendanceError] = useState('');

    const [resettingStudents, setResettingStudents] = useState(false);
    const [resetStudentsMessage, setResetStudentsMessage] = useState('');
    const [resetStudentsError, setResetStudentsError] = useState('');

    const apiUrl = process.env.REACT_APP_API_URL;

    // --- Fetch teacher-specific locations ---
    const fetchLocations = async () => {
        setLoadingLocations(true);
        setLocationError('');
        try {
            const response = await axios.get(`${apiUrl}/api/locations`);
            setLocations(response.data);
        } catch (err) {
            setLocationError(`Could not load locations: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoadingLocations(false);
        }
    };

    useEffect(() => {
        if (teacher) fetchLocations();
    }, [teacher]);

    // --- Handle Profile Update ---
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileMessage('');
        setProfileError('');

        try {
            const response = await axios.put(`${apiUrl}/api/auth/update`, profileData);
            // Update the global auth context so the Navbar and Dashboard reflect changes immediately
            login(localStorage.getItem('token'), response.data.teacher); 
            setProfileMessage('Profile updated successfully!');
        } catch (err) {
            setProfileError(err.response?.data?.message || 'Failed to update profile.');
        } finally {
            setProfileLoading(false);
        }
    };

    const handleProfileChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    // --- Add/Delete Locations ---
    const handleAddLocation = async (e) => {
        e.preventDefault();
        setFormError('');
        if (!newLocationName.trim()) { setFormError('Location name cannot be empty.'); return; }
        try {
            const response = await axios.post(`${apiUrl}/api/locations`, { name: newLocationName });
            setLocations([...locations, response.data]);
            setNewLocationName('');
        } catch (err) {
             setFormError(`Error: ${err.response?.data?.message || err.message}`);
         }
    };

    const handleDeleteLocation = async (id) => {
        if (window.confirm('Delete this location? This will not remove students assigned here.')) {
            try {
                await axios.delete(`${apiUrl}/api/locations/${id}`);
                setLocations(locations.filter(loc => loc._id !== id));
            } catch (err) {
                 alert(`Error: ${err.response?.data?.message || err.message}`);
             }
        }
    };

    // --- Reset Handlers (Scoped to Teacher) ---
    const handleResetFinance = async () => {
        setResetFinanceMessage(''); setResetFinanceError('');
        if (window.confirm('🚨 DANGER: This will delete ALL your payment records forever.')) {
            setResettingFinance(true);
            try {
                const response = await axios.delete(`${apiUrl}/api/payments/reset`);
                setResetFinanceMessage(response.data.message);
            } catch (err) {
                 setResetFinanceError(err.response?.data?.message || err.message);
            } finally { setResettingFinance(false); }
        }
    };

    const handleResetAttendance = async () => {
        setResetAttendanceMessage(''); setResetAttendanceError('');
        if (window.confirm('🚨 DANGER: This will delete ALL your attendance logs.')) {
            setResettingAttendance(true);
            try {
                const response = await axios.delete(`${apiUrl}/api/attendance/reset`);
                setResetAttendanceMessage(response.data.message);
            } catch (err) {
                 setResetAttendanceError(err.response?.data?.message || err.message);
            } finally { setResettingAttendance(false); }
        }
    };

    const handleResetStudents = async () => {
        setResetStudentsMessage(''); setResetStudentsError('');
        if (window.confirm('🚨 WARNING: This will hide all your current students. Proceed?')) {
            setResettingStudents(true);
            try {
                const response = await axios.delete(`${apiUrl}/api/students/reset`);
                setResetStudentsMessage(response.data.message);
            } catch (err) {
                 setResetStudentsError(err.response?.data?.message || err.message);
            } finally { setResettingStudents(false); }
        }
    };

    return (
        <Container className="mt-4 pb-5">
            <div className="mb-4">
                <h2 className="fw-bold">Settings</h2>
                <p className="text-muted">
                    Account: <strong>{teacher?.firstName} {teacher?.lastName}</strong> | {teacher?.instituteName}
                </p>
            </div>

            <Row>
                <Col lg={7}>
                    {/* --- Account Profile Card --- */}
                    <Card className="shadow-sm border-0 mb-4">
                        <Card.Header className="bg-white py-3">
                            <h5 className="mb-0 fw-bold"><FaUserEdit className="me-2" /> Account Profile</h5>
                        </Card.Header>
                        <Card.Body>
                            {profileMessage && <Alert variant="success">{profileMessage}</Alert>}
                            {profileError && <Alert variant="danger">{profileError}</Alert>}
                            <Form onSubmit={handleProfileUpdate}>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small fw-bold">First Name</Form.Label>
                                            <Form.Control type="text" name="firstName" value={profileData.firstName} onChange={handleProfileChange} required />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small fw-bold">Last Name</Form.Label>
                                            <Form.Control type="text" name="lastName" value={profileData.lastName} onChange={handleProfileChange} required />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold">Institute Name</Form.Label>
                                    <Form.Control type="text" name="instituteName" value={profileData.instituteName} onChange={handleProfileChange} required />
                                </Form.Group>
                                <Form.Group className="mb-4">
                                    <Form.Label className="small fw-bold">Base City / Location</Form.Label>
                                    <Form.Control type="text" name="location" value={profileData.location} onChange={handleProfileChange} required />
                                </Form.Group>
                                <Button variant="primary" type="submit" disabled={profileLoading}>
                                    {profileLoading ? <Spinner size="sm" /> : 'Save Profile Changes'}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>

                    {/* --- Location Management --- */}
                    <Card className="shadow-sm border-0 mb-4">
                        <Card.Header className="bg-white py-3">
                            <h5 className="mb-0 fw-bold"><FaMapMarkerAlt className="me-2" /> My Class Venues</h5>
                        </Card.Header>
                        <Card.Body>
                            <Form onSubmit={handleAddLocation} className="d-flex mb-4">
                                <Form.Control
                                    type="text"
                                    placeholder="e.g., Colombo Hall"
                                    value={newLocationName}
                                    onChange={(e) => setNewLocationName(e.target.value)}
                                    className="me-2"
                                />
                                <Button type="submit" variant="dark">Add</Button>
                            </Form>
                            
                            <ListGroup variant="flush" className="border rounded">
                                {loadingLocations ? (
                                    <div className="p-3 text-center"><Spinner animation="border" size="sm" /></div>
                                ) : locations.length > 0 ? (
                                    locations.map(loc => (
                                        <ListGroup.Item key={loc._id} className="d-flex justify-content-between align-items-center py-3">
                                            <span className="fw-semibold">{loc.name}</span>
                                            <CloseButton onClick={() => handleDeleteLocation(loc._id)} />
                                        </ListGroup.Item>
                                    ))
                                ) : (
                                    <ListGroup.Item className="text-muted text-center py-4">No venues added.</ListGroup.Item>
                                )}
                            </ListGroup>
                        </Card.Body>
                    </Card>
                </Col>

                {/* --- Danger Zone --- */}
                <Col lg={5}>
                    <h5 className="mb-3 text-danger fw-bold px-1"><FaExclamationTriangle className="me-2" /> Danger Zone</h5>
                    
                    <Card border="danger" className="mb-3 shadow-sm">
                        <Card.Body>
                            <h6 className="fw-bold">Reset Financial Data</h6>
                            <p className="small text-muted">Delete all fee records. This is permanent.</p>
                            {resetFinanceMessage && <Alert variant="success" className="small">{resetFinanceMessage}</Alert>}
                            <Button variant="outline-danger" size="sm" onClick={handleResetFinance} disabled={resettingFinance}>
                                {resettingFinance ? <Spinner size="sm" /> : 'Delete Payments'}
                            </Button>
                        </Card.Body>
                    </Card>

                    <Card border="danger" className="mb-3 shadow-sm">
                        <Card.Body>
                            <h6 className="fw-bold">Reset Attendance History</h6>
                            <p className="small text-muted">Clear all class attendance logs forever.</p>
                            {resetAttendanceMessage && <Alert variant="success" className="small">{resetAttendanceMessage}</Alert>}
                            <Button variant="outline-danger" size="sm" onClick={handleResetAttendance} disabled={resettingAttendance}>
                                {resettingAttendance ? <Spinner size="sm" /> : 'Clear Logs'}
                            </Button>
                        </Card.Body>
                    </Card>

                    <Card border="danger" className="mb-3 shadow-sm">
                        <Card.Body>
                            <h6 className="fw-bold">Deactivate All Students</h6>
                            <p className="small text-muted">Archive all active students. Records are kept.</p>
                            {resetStudentsMessage && <Alert variant="success" className="small">{resetStudentsMessage}</Alert>}
                            <Button variant="outline-danger" size="sm" onClick={handleResetStudents} disabled={resettingStudents}>
                                {resettingStudents ? <Spinner size="sm" /> : 'Deactivate All'}
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default SettingsPage;