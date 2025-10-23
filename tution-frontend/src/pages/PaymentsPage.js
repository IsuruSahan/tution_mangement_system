import React, { useState, useEffect } from 'react'; // Added useEffect
import axios from 'axios';
import { Container, Row, Col, Form, Button, Card, Table, Spinner, Alert, Badge } from 'react-bootstrap';

// Helper array for month dropdown
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function PaymentsPage() {
    // --- State for Filters ---
    const [month, setMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
    const [year, setYear] = useState(new Date().getFullYear());
    const [grade, setGrade] = useState('All');
    const [location, setLocation] = useState('All');

    // --- State for Data ---
    const [studentList, setStudentList] = useState([]);
    const [loading, setLoading] = useState(false); // Loading for student list
    const [error, setError] = useState('');

    // --- State for Amounts ---
    const [amounts, setAmounts] = useState({});

    // --- NEW STATE FOR LOCATIONS ---
    const [locations, setLocations] = useState([]);
    const [locationLoading, setLocationLoading] = useState(true);

    // --- NEW: Fetch locations when component loads ---
    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/locations');
                setLocations(res.data);
                setLocationLoading(false);
            } catch (err) {
                console.error("Failed to fetch locations", err);
                // Keep the page functional, just show an error or empty dropdown
                setError("Failed to load locations for filtering.");
                setLocationLoading(false);
            }
        };
        fetchLocations();
    }, []); // Empty array means runs once on mount

    // --- Updates the 'amounts' state (No Change) ---
    const handleAmountChange = (studentId, amount) => {
        setAmounts(prevAmounts => ({ ...prevAmounts, [studentId]: amount }));
    };

    // --- Load the Student List based on filters (No Change) ---
    const loadStudentPaymentList = async () => {
        setLoading(true);
        setError('');
        setStudentList([]);
        try {
            const response = await axios.get('http://localhost:5000/api/payments/statuslist', {
                params: { month, year, grade, location }
            });
            setStudentList(response.data);
            setAmounts({});
        } catch (err) {
            setError('Error loading student list.');
        }
        setLoading(false);
    };

    // --- Mark a student as Paid or Pending (No Change) ---
    const handleMarkPayment = async (studentId, newStatus) => {
        try {
            let paymentData = { studentId, month, year, status: newStatus };
            if (newStatus === 'Paid') {
                const amountToSave = amounts[studentId];
                if (!amountToSave || Number(amountToSave) <= 0) {
                    alert('Please enter a valid payment amount.');
                    return;
                }
                paymentData.amount = Number(amountToSave);
            }
            const response = await axios.post('http://localhost:5000/api/payments/mark', paymentData);
            const updatedPayment = response.data;
            setStudentList(currentList =>
                currentList.map(item => {
                    if (item.student._id === studentId) {
                        return { ...item, status: updatedPayment.status, amount: updatedPayment.amount };
                    }
                    return item;
                })
            );
            if (newStatus === 'Paid') {
                setAmounts(prev => ({ ...prev, [studentId]: '' }));
            }
        } catch (err) {
            alert('Failed to update status. Please try again.');
            console.error(err);
        }
    };

    return (
        <Container className="mt-4">
            <Card className="mb-4">
                <Card.Body>
                    <Card.Title>Manage Monthly Payments</Card.Title>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form>
                        <Row>
                            {/* --- Month, Year, Grade Filters (No Change) --- */}
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Month</Form.Label>
                                    <Form.Select value={month} onChange={(e) => setMonth(e.target.value)}>
                                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={2}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Year</Form.Label>
                                    <Form.Control type="number" value={year} onChange={(e) => setYear(e.target.value)} />
                                </Form.Group>
                            </Col>
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

                            {/* --- MODIFIED: Location Filter --- */}
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
                                                <option key={loc._id} value={loc.name}>
                                                    {loc.name}
                                                </option>
                                            ))
                                        )}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            {/* --- Load Button (No Change) --- */}
                            <Col md={2} className="d-flex align-items-end mb-3">
                                <Button onClick={loadStudentPaymentList} className="w-100" disabled={loading || locationLoading}>
                                    {loading ? <Spinner as="span" size="sm" /> : 'Load'}
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            {/* --- The Student Payment List (No Change in structure, only uses filtered data) --- */}
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
                                <td>{item.student.name}</td>
                                <td>{item.student.grade}</td>
                                <td>{item.student.location}</td>
                                <td>
                                    {item.status === 'Paid' ? (
                                        `LKR ${item.amount ? item.amount.toLocaleString() : '0'}`
                                    ) : (
                                        <Form.Control
                                            type="number"
                                            placeholder="Enter amount"
                                            value={amounts[item.student._id] || ''}
                                            onChange={(e) => handleAmountChange(item.student._id, e.target.value)}
                                        />
                                    )}
                                </td>
                                <td>
                                    <Badge bg={item.status === 'Paid' ? 'success' : 'warning'}>
                                        {item.status}
                                    </Badge>
                                </td>
                                <td>
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

            {!loading && studentList.length === 0 && (
                <Alert variant="info">Select your filters and click "Load" to see the student payment list.</Alert>
            )}
        </Container>
    );
}

export default PaymentsPage;