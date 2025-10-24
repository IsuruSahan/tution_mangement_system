import React, { useState, useEffect } from 'react'; // Added useEffect
import axios from 'axios';
import { Container, Row, Col, Form, Button, Card, Table, Spinner, Alert, Badge } from 'react-bootstrap';

// Helper array for month dropdown (unchanged)
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function PaymentsPage() {
    // --- State (unchanged) ---
    const [month, setMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
    const [year, setYear] = useState(new Date().getFullYear());
    const [grade, setGrade] = useState('All');
    const [location, setLocation] = useState('All');
    const [studentList, setStudentList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [amounts, setAmounts] = useState({});
    const [locations, setLocations] = useState([]);
    const [locationLoading, setLocationLoading] = useState(true);

    // --- Fetch locations (Uses Environment Variable) ---
    useEffect(() => {
        const fetchLocations = async () => {
            setLocationLoading(true);
            setError(''); // Clear page-specific errors on load
            try {
                // Get API URL from environment
                const apiUrl = process.env.REACT_APP_API_URL;
                if (!apiUrl) {
                    throw new Error("API URL is not configured. Check Vercel environment variables.");
                }
                const res = await axios.get(`${apiUrl}/api/locations`); // Use apiUrl
                setLocations(res.data);
            } catch (err) {
                console.error("Failed to fetch locations:", err);
                setError(`Failed to load locations list: ${err.message}`); // Set specific error
            } finally {
                setLocationLoading(false);
            }
        };
        fetchLocations();
    }, []); // Runs once on mount

    // --- Updates the 'amounts' state (Unchanged) ---
    const handleAmountChange = (studentId, amount) => {
        setAmounts(prevAmounts => ({ ...prevAmounts, [studentId]: amount }));
    };

    // --- Load the Student List (Uses Environment Variable) ---
    const loadStudentPaymentList = async () => {
        setLoading(true);
        setError(''); // Clear previous errors
        setStudentList([]);
        setAmounts({});
        try {
            // Get API URL from environment
            const apiUrl = process.env.REACT_APP_API_URL;
            if (!apiUrl) {
                throw new Error("API URL is not configured.");
            }
            const response = await axios.get(`${apiUrl}/api/payments/statuslist`, { // Use apiUrl
                params: { month, year, grade, location }
            });
            setStudentList(response.data);
        } catch (err) {
            console.error("Error loading student payment list:", err);
            setError(`Error loading student list: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // --- Mark a student as Paid or Pending (Uses Environment Variable) ---
    const handleMarkPayment = async (studentId, newStatus) => {
        try {
            // Get API URL from environment
            const apiUrl = process.env.REACT_APP_API_URL;
            if (!apiUrl) {
                throw new Error("API URL is not configured.");
            }

            let paymentData = { studentId, month, year, status: newStatus };
            if (newStatus === 'Paid') {
                const amountToSave = amounts[studentId];
                if (!amountToSave || Number(amountToSave) <= 0) {
                    alert('Please enter a valid payment amount.');
                    return;
                }
                paymentData.amount = Number(amountToSave);
            }

            const response = await axios.post(`${apiUrl}/api/payments/mark`, paymentData); // Use apiUrl
            const updatedPayment = response.data;
            // Update the state immutably
            setStudentList(currentList =>
                currentList.map(item => {
                    if (item.student._id === studentId) {
                        // Return a new object with updated status and amount
                        return { ...item, status: updatedPayment.status, amount: updatedPayment.amount };
                    }
                    return item; // Keep other items the same
                })
            );
            // Clear the amount input only if successfully marked as Paid
            if (newStatus === 'Paid') {
                setAmounts(prev => {
                    const next = { ...prev };
                    delete next[studentId]; // Remove the entry instead of setting to ''
                    return next;
                });
            }
        } catch (err) {
            console.error("Error updating payment status:", err);
            // Show more specific error from backend if available
            alert(`Failed to update status: ${err.response?.data?.message || err.message}`);
        }
    };

    // --- Render JSX ---
    return (
        <Container className="mt-4">
            <Card className="mb-4">
                <Card.Body>
                    <Card.Title>Manage Monthly Payments</Card.Title>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form>
                        <Row>
                            {/* --- Month Filter --- */}
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Month</Form.Label>
                                    <Form.Select value={month} onChange={(e) => setMonth(e.target.value)}>
                                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            {/* --- Year Filter --- */}
                            <Col md={2}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Year</Form.Label>
                                    <Form.Control type="number" value={year} onChange={(e) => setYear(e.target.value)} />
                                </Form.Group>
                            </Col>
                            {/* --- Grade Filter --- */}
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Grade</Form.Label>
                                    <Form.Select value={grade} onChange={(e) => setGrade(e.target.value)}>
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
                            {/* --- Location Filter --- */}
                            <Col md={2}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Location</Form.Label>
                                    <Form.Select
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        disabled={locationLoading}
                                    >
                                        <option value="All">All Locations</option>
                                        {locationLoading ? (
                                            <option disabled>Loading...</option>
                                        ) : (
                                            locations.map(loc => (
                                                <option key={loc._id} value={loc.name}>{loc.name}</option>
                                            ))
                                        )}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            {/* --- Load Button --- */}
                            <Col md={2} className="d-flex align-items-end mb-3">
                                <Button onClick={loadStudentPaymentList} className="w-100" disabled={loading || locationLoading}>
                                    {loading ? <Spinner as="span" size="sm" /> : 'Load'}
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            {/* --- Student Payment List Table --- */}
            {loading && <div className="text-center"><Spinner animation="border" /></div>}
            {!loading && studentList.length > 0 && (
                <Table striped bordered hover responsive>
                    <thead>
                        <tr>
                            <th>Student Name</th>
                            <th>Grade</th>
                            <th>Location</th>
                            <th>Amount (LKR)</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {studentList.map(item => (
                            <tr key={item.student._id}>
                                {/* --- MODIFIED CELL --- */}
                                <td>{item.student.name} ({item.student.studentId || 'No ID'})</td>
                                {/* --- END MODIFICATION --- */}
                                <td>{item.student.grade}</td>
                                <td>{item.student.location}</td>
                                <td> {/* Amount Cell */}
                                    {item.status === 'Paid' ? (
                                        `LKR ${item.amount != null ? item.amount.toLocaleString() : 'N/A'}` // Handle null amount better
                                    ) : (
                                        <Form.Control
                                            type="number"
                                            placeholder="Enter amount"
                                            value={amounts[item.student._id] || ''}
                                            onChange={(e) => handleAmountChange(item.student._id, e.target.value)}
                                        />
                                    )}
                                </td>
                                <td> {/* Status Badge */}
                                    <Badge bg={item.status === 'Paid' ? 'success' : 'warning'}>{item.status}</Badge>
                                </td>
                                <td> {/* Action Buttons */}
                                    {item.status === 'Pending' ? (
                                        <Button variant="success" size="sm" onClick={() => handleMarkPayment(item.student._id, 'Paid')}>
                                            Save Paid
                                        </Button>
                                    ) : (
                                        <Button variant="warning" size="sm" onClick={() => handleMarkPayment(item.student._id, 'Pending')}>
                                            Mark as Pending
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
            {/* Message if no students found */}
            {!loading && studentList.length === 0 && (
                <Alert variant="info">Select your filters and click "Load" to see the student payment list.</Alert>
            )}
        </Container>
    );
}

export default PaymentsPage;