import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Form, Button, ListGroup, Spinner, Alert, CloseButton } from 'react-bootstrap';

function SettingsPage() {
    // --- State for Locations ---
    const [locations, setLocations] = useState([]);
    const [loadingLocations, setLoadingLocations] = useState(true);
    const [locationError, setLocationError] = useState('');
    const [newLocationName, setNewLocationName] = useState('');
    const [formError, setFormError] = useState('');

    // --- State for Finance Reset ---
    const [resettingFinance, setResettingFinance] = useState(false);
    const [resetFinanceMessage, setResetFinanceMessage] = useState('');
    const [resetFinanceError, setResetFinanceError] = useState('');

    // --- State for Attendance Reset ---
    const [resettingAttendance, setResettingAttendance] = useState(false);
    const [resetAttendanceMessage, setResetAttendanceMessage] = useState('');
    const [resetAttendanceError, setResetAttendanceError] = useState('');

    // --- State for Student Reset ---
    const [resettingStudents, setResettingStudents] = useState(false);
    const [resetStudentsMessage, setResetStudentsMessage] = useState('');
    const [resetStudentsError, setResetStudentsError] = useState('');

    // Get API URL from environment
    const apiUrl = process.env.REACT_APP_API_URL;

    // --- Fetch locations from API ---
    const fetchLocations = async () => {
        setLoadingLocations(true);
        setLocationError('');
        try {
            if (!apiUrl) throw new Error("API URL is not configured.");
            const response = await axios.get(`${apiUrl}/api/locations`); // Use apiUrl
            setLocations(response.data);
        } catch (err) {
            console.error("Failed to fetch locations:", err);
            setLocationError(`Could not load locations: ${err.message}`);
        } finally {
            setLoadingLocations(false);
        }
    };

    useEffect(() => {
        if(apiUrl) { // Only fetch if apiUrl is set
            fetchLocations();
        } else {
            setLocationError("API URL is not configured. Check Vercel/local .env file.");
            setLoadingLocations(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiUrl]); // Re-run if apiUrl changes (though it shouldn't)

    // --- Handle adding a location ---
    const handleAddLocation = async (e) => {
        e.preventDefault();
        setFormError('');
        if (!newLocationName) { setFormError('Location name cannot be empty.'); return; }
        if (!apiUrl) { setFormError("API URL not configured."); return; } // Check URL
        try {
            const response = await axios.post(`${apiUrl}/api/locations`, { name: newLocationName }); // Use apiUrl
            setLocations([...locations, response.data]);
            setNewLocationName('');
        } catch (err) {
             console.error("Error adding location:", err);
             setFormError(`Error adding location: ${err.response?.data?.message || err.message}`);
         }
    };

    // --- Handle deleting a location ---
    const handleDeleteLocation = async (id) => {
        if (!apiUrl) { alert("API URL not configured."); return; } // Check URL
        if (window.confirm('Are you sure you want to delete this location?')) {
            try {
                await axios.delete(`${apiUrl}/api/locations/${id}`); // Use apiUrl
                setLocations(locations.filter(loc => loc._id !== id));
            } catch (err) {
                 console.error("Error deleting location:", err);
                 alert(`Error deleting location: ${err.response?.data?.message || err.message}`);
             }
        }
    };

    // --- Handle Reset Finance Data ---
    const handleResetFinance = async () => {
        setResetFinanceMessage(''); setResetFinanceError('');
        if (!apiUrl) { setResetFinanceError("API URL not configured."); return; } // Check URL
        if (window.confirm('🚨 DANGER! Are you ABSOLUTELY SURE...?') &&
            window.confirm('🚨 FINAL WARNING! Really delete all finance data?')) {
            setResettingFinance(true);
            try {
                const response = await axios.delete(`${apiUrl}/api/payments/reset`); // Use apiUrl
                setResetFinanceMessage(response.data.message || 'Finance data reset successfully.');
            } catch (err) {
                 console.error("Error resetting finance data:", err);
                 setResetFinanceError(`Failed to reset finance data: ${err.response?.data?.message || err.message}`);
            } finally {
                setResettingFinance(false);
            }
        }
    };

    // --- Handle Reset Attendance Data ---
    const handleResetAttendance = async () => {
        setResetAttendanceMessage(''); setResetAttendanceError('');
        if (!apiUrl) { setResetAttendanceError("API URL not configured."); return; } // Check URL
        if (window.confirm('🚨 DANGER! Are you ABSOLUTELY SURE...?') &&
            window.confirm('🚨 FINAL WARNING! Really delete all attendance data?')) {
            setResettingAttendance(true);
            try {
                const response = await axios.delete(`${apiUrl}/api/attendance/reset`); // Use apiUrl
                setResetAttendanceMessage(response.data.message || 'Attendance data reset successfully.');
            } catch (err) {
                 console.error("Error resetting attendance data:", err);
                 setResetAttendanceError(`Failed to reset attendance data: ${err.response?.data?.message || err.message}`);
            } finally {
                setResettingAttendance(false);
            }
        }
    };

    // --- Handle Reset Student Data ---
    const handleResetStudents = async () => {
        setResetStudentsMessage(''); setResetStudentsError('');
        if (!apiUrl) { setResetStudentsError("API URL not configured."); return; } // Check URL
        if (window.confirm('🚨 DANGER! Are you ABSOLUTELY SURE...?') &&
            window.confirm('🚨 FINAL WARNING! Really deactivate all students?')) {
            setResettingStudents(true);
            try {
                const response = await axios.delete(`${apiUrl}/api/students/reset`); // Use apiUrl
                setResetStudentsMessage(response.data.message || 'All students deactivated successfully.');
            } catch (err) {
                 console.error("Error deactivating students:", err);
                 setResetStudentsError(`Failed to deactivate students: ${err.response?.data?.message || err.message}`);
            } finally {
                setResettingStudents(false);
            }
        }
    };


    return (
        <Container className="mt-4">
            <Row>
                {/* --- Manage Locations Card --- */}
                <Col md={12} lg={6} className="mb-4">
                    <Card>
                        <Card.Header> <Card.Title as="h2" className="mb-0">Manage Locations</Card.Title> </Card.Header>
                        <Card.Body>
                            <h5 className="mb-3">Add New Location</h5>
                            {formError && <Alert variant="danger">{formError}</Alert>}
                            <Form onSubmit={handleAddLocation} className="d-flex mb-4">
                                <Form.Control
                                    type="text"
                                    placeholder="Enter new location name"
                                    value={newLocationName}
                                    onChange={(e) => setNewLocationName(e.target.value)}
                                    className="me-2"
                                />
                                <Button type="submit" disabled={loadingLocations}>Add</Button>
                            </Form>
                            <hr />
                            <h5 className="mb-3">Current Locations</h5>
                            {loadingLocations && <Spinner animation="border" size="sm" />}
                            {locationError && <Alert variant="danger">{locationError}</Alert>}
                            <ListGroup>
                                {!loadingLocations && locations.length > 0 ? (
                                    locations.map(loc => (
                                        <ListGroup.Item key={loc._id} className="d-flex justify-content-between align-items-center">
                                            {loc.name}
                                            <CloseButton onClick={() => handleDeleteLocation(loc._id)} title="Delete" />
                                        </ListGroup.Item>
                                    ))
                                ) : (
                                    !loadingLocations && <p className="text-muted">No locations added yet.</p>
                                )}
                            </ListGroup>
                        </Card.Body>
                    </Card>
                </Col>

                {/* --- Danger Zone Column --- */}
                <Col md={12} lg={6}>
                    <h2 className="mb-3 text-danger">⚠️ Danger Zone</h2>

                    {/* --- Reset Finance Card --- */}
                    <Card border="danger" className="mb-4">
                        <Card.Header className="bg-danger text-white"> <Card.Title as="h3" className="mb-0">Reset Finance Data</Card.Title> </Card.Header>
                        <Card.Body>
                            <p className="text-danger">Permanently delete <strong>ALL</strong> payment records.</p>
                            {resetFinanceMessage && <Alert variant="success">{resetFinanceMessage}</Alert>}
                            {resetFinanceError && <Alert variant="danger">{resetFinanceError}</Alert>}
                            <Button variant="danger" onClick={handleResetFinance} disabled={resettingFinance}>
                                {resettingFinance ? <Spinner as="span" animation="border" size="sm" /> : 'Reset Payments'}
                            </Button>
                        </Card.Body>
                    </Card>

                    {/* --- Reset Attendance Card --- */}
                    <Card border="danger" className="mb-4">
                        <Card.Header className="bg-danger text-white"> <Card.Title as="h3" className="mb-0">Reset Attendance Data</Card.Title> </Card.Header>
                        <Card.Body>
                            <p className="text-danger">Permanently delete <strong>ALL</strong> attendance records.</p>
                            {resetAttendanceMessage && <Alert variant="success">{resetAttendanceMessage}</Alert>}
                            {resetAttendanceError && <Alert variant="danger">{resetAttendanceError}</Alert>}
                            <Button variant="danger" onClick={handleResetAttendance} disabled={resettingAttendance}>
                                {resettingAttendance ? <Spinner as="span" animation="border" size="sm" /> : 'Reset Attendance'}
                            </Button>
                        </Card.Body>
                    </Card>

                     {/* --- Reset Students Card --- */}
                    <Card border="danger" className="mb-4">
                        <Card.Header className="bg-danger text-white"> <Card.Title as="h3" className="mb-0">Deactivate All Students</Card.Title> </Card.Header>
                        <Card.Body>
                            <p className="text-danger">Set <strong>ALL</strong> students to inactive. They will be hidden but their data remains.</p>
                            {resetStudentsMessage && <Alert variant="success">{resetStudentsMessage}</Alert>}
                            {resetStudentsError && <Alert variant="danger">{resetStudentsError}</Alert>}
                            <Button variant="danger" onClick={handleResetStudents} disabled={resettingStudents}>
                                {resettingStudents ? <Spinner as="span" animation="border" size="sm" /> : 'Deactivate All Students'}
                            </Button>
                        </Card.Body>
                    </Card>

                </Col>
            </Row>
        </Container>
    );
}

export default SettingsPage;