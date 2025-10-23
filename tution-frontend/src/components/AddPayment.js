import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Button, Row, Col, Alert, Card } from 'react-bootstrap';

function AddPayment({ onPaymentAdded }) {
    // ... (all state is the same) ...
    const [studentId, setStudentId] = useState('');
    const [month, setMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
    const [year, setYear] = useState(new Date().getFullYear());
    const [amount, setAmount] = useState('');
    const [students, setStudents] = useState([]);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // ... (useEffect is the same) ...
    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/students');
                setStudents(response.data);
                if (response.data.length > 0) {
                    setStudentId(response.data[0]._id);
                }
            } catch (err) {
                setError('Could not load students for the form.');
            }
        };
        fetchStudents();
    }, []);

    // --- 2. Handle Form Submit ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (!studentId || !month || !year || !amount) {
            return setError('All fields are required.');
        }

        try {
            const newPayment = {
                studentId, 
                month,
                year: Number(year),
                amount: Number(amount),
                status: 'Paid' // <-- CHANGED FROM 'Pending' TO 'Paid'
            };

            // This URL is correct from our previous fix
            await axios.post('http://localhost:5000/api/payments/mark', newPayment);
            
            setMessage('Payment logged successfully.');
            setAmount(''); 

            if (onPaymentAdded) {
                onPaymentAdded();
            }

        } catch (err) {
            setError('Error logging payment.');
            console.error(err);
        }
    };

    // ... (The rest of the file, including the return() statement, is exactly the same) ...
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    return (
        <Card className="mb-4">
            <Card.Body>
                <Card.Title>Log a New Payment</Card.Title>
                
                {message && <Alert variant="success">{message}</Alert>}
                {error && <Alert variant="danger">{error}</Alert>}

                <Form onSubmit={handleSubmit}>
                    {/* ... all form fields ... */}
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="formPaymentStudent">
                                <Form.Label>Student</Form.Label>
                                <Form.Select value={studentId} onChange={(e) => setStudentId(e.target.value)} required>
                                    <option value="">Select a Student...</option>
                                    {students.map(student => (
                                        <option key={student._id} value={student._id}>
                                            {student.name} ({student.grade} - {student.location})
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="formPaymentAmount">
                                <Form.Label>Amount (LKR)</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="e.g., 2000"
                                    required
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="formPaymentMonth">
                                <Form.Label>Month</Form.Label>
                                <Form.Select value={month} onChange={(e) => setMonth(e.target.value)}>
                                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="formPaymentYear">
                                <Form.Label>Year</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={year}
                                    onChange={(e) => setYear(e.gaset.value)}
                                    required
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Button variant="primary" type="submit">
                        Log Payment
                    </Button>
                </Form>
            </Card.Body>
        </Card>
    );
}

export default AddPayment;