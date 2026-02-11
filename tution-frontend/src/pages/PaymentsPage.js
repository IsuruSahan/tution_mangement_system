import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Form, Button, Card, Table, Spinner, Alert, Badge } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext'; // Import Auth hook

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function PaymentsPage() {
    const { teacher } = useAuth(); // Access teacher global state
    
    // --- State ---
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

    const apiUrl = process.env.REACT_APP_API_URL;

    // --- Fetch Locations (Auth-Aware) ---
    useEffect(() => {
        const fetchLocations = async () => {
            setLocationLoading(true);
            setError(''); 
            try {
                if (!apiUrl) throw new Error("API URL is not configured.");
                const res = await axios.get(`${apiUrl}/api/locations`);
                setLocations(res.data);
            } catch (err) {
                console.error("Failed to fetch locations:", err);
                setError(`Failed to load locations: ${err.response?.data?.message || err.message}`);
            } finally {
                setLocationLoading(false);
            }
        };
        if (teacher) fetchLocations();
    }, [teacher, apiUrl]);

    const handleAmountChange = (studentId, amount) => {
        setAmounts(prev => ({ ...prev, [studentId]: amount }));
    };

    // --- Load Student Payment List (Auth-Aware) ---
    const loadStudentPaymentList = async () => {
        setLoading(true);
        setError(''); 
        setStudentList([]);
        setAmounts({});
        try {
            if (!apiUrl) throw new Error("API URL is not configured.");
            
            // Axios automatically attaches the Bearer token here
            const response = await axios.get(`${apiUrl}/api/payments/statuslist`, {
                params: { month, year, grade, location }
            });
            setStudentList(response.data);
        } catch (err) {
            console.error("Error loading payment list:", err);
            setError(`Error loading list: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // --- Mark Payment (Auth-Aware) ---
    const handleMarkPayment = async (studentId, newStatus) => {
        try {
            if (!apiUrl) throw new Error("API URL is not configured.");

            let paymentData = { studentId, month, year, status: newStatus };
            if (newStatus === 'Paid') {
                const amountToSave = amounts[studentId];
                if (!amountToSave || Number(amountToSave) <= 0) {
                    alert('Please enter a valid payment amount.');
                    return;
                }
                paymentData.amount = Number(amountToSave);
            }

            // Secure POST request tagged with teacherId on the backend
            const response = await axios.post(`${apiUrl}/api/payments/mark`, paymentData);
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
                setAmounts(prev => {
                    const next = { ...prev };
                    delete next[studentId];
                    return next;
                });
            }
        } catch (err) {
            console.error("Error updating payment status:", err);
            alert(`Failed to update: ${err.response?.data?.message || err.message}`);
        }
    };

    return (
        <Container className="mt-4">
            <Card className="shadow-sm border-0 mb-4">
                <Card.Body className="p-4">
                    <Card.Title className="fw-bold mb-4">Financial Records: {teacher?.instituteName}</Card.Title>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form>
                        <Row className="g-3">
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold">Select Month</Form.Label>
                                    <Form.Select value={month} onChange={(e) => setMonth(e.target.value)}>
                                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={2}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold">Year</Form.Label>
                                    <Form.Control type="number" value={year} onChange={(e) => setYear(e.target.value)} />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold">Grade Filter</Form.Label>
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
                            <Col md={2}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold">Location</Form.Label>
                                    <Form.Select
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        disabled={locationLoading}
                                    >
                                        <option value="All">All Locations</option>
                                        {!locationLoading && locations.map(loc => (
                                            <option key={loc._id} value={loc.name}>{loc.name}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={2} className="d-flex align-items-end">
                                <Button onClick={loadStudentPaymentList} variant="primary" className="w-100 fw-bold" disabled={loading}>
                                    {loading ? <Spinner as="span" size="sm" /> : 'Fetch List'}
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            {studentList.length > 0 ? (
                <Table striped borderless hover responsive className="bg-white shadow-sm rounded">
                    <thead className="table-dark">
                        <tr>
                            <th>Student Details</th>
                            <th>Grade</th>
                            <th>Location</th>
                            <th>Fee Amount</th>
                            <th>Status</th>
                            <th className="text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="align-middle">
                        {studentList.map(item => (
                            <tr key={item.student._id}>
                                <td>
                                    <div className="fw-bold">{item.student.name}</div>
                                    <small className="text-muted">ID: {item.student.studentId}</small>
                                </td>
                                <td>{item.student.grade}</td>
                                <td>{item.student.location}</td>
                                <td style={{ minWidth: '150px' }}>
                                    {item.status === 'Paid' ? (
                                        <span className="fw-bold">LKR {(item.amount || 0).toLocaleString()}</span>
                                    ) : (
                                        <Form.Control
                                            size="sm"
                                            type="number"
                                            placeholder="Enter LKR"
                                            value={amounts[item.student._id] || ''}
                                            onChange={(e) => handleAmountChange(item.student._id, e.target.value)}
                                        />
                                    )}
                                </td>
                                <td>
                                    <Badge pill bg={item.status === 'Paid' ? 'success' : 'warning'} className="px-3">
                                        {item.status.toUpperCase()}
                                    </Badge>
                                </td>
                                <td className="text-center">
                                    {item.status === 'Pending' ? (
                                        <Button variant="outline-success" size="sm" onClick={() => handleMarkPayment(item.student._id, 'Paid')}>
                                            Mark Paid
                                        </Button>
                                    ) : (
                                        <Button variant="outline-danger" size="sm" onClick={() => handleMarkPayment(item.student._id, 'Pending')}>
                                            Undo Payment
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            ) : (
                !loading && (
                    <Alert variant="light" className="text-center border py-5">
                        <p className="mb-0 text-muted fs-5">Use the filters above to load the student list for payment processing.</p>
                    </Alert>
                )
            )}
        </Container>
    );
}

export default PaymentsPage;