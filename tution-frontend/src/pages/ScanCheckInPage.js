import React, { useState } from 'react';
import axios from 'axios';
import { QrReader } from 'react-qr-reader';
import { Container, Card, Button, Spinner, Alert, ListGroup, Row, Col, Badge } from 'react-bootstrap';
import { FaCheckCircle, FaTimesCircle, FaUser, FaQrcode } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext'; // Import Auth hook

function ScanCheckInPage() {
    const { teacher } = useAuth(); // Access global teacher identity
    const [scannedStudent, setScannedStudent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const apiUrl = process.env.REACT_APP_API_URL;

    // --- QR Scan Handler ---
    const handleScanResult = async (result, error) => {
        // Prevent multiple simultaneous scans
        if (!!result && !loading && !scannedStudent) {
            const studentId = result?.text;
            if (studentId) {
                setLoading(true);
                setError('');
                setSuccess('');

                try {
                    // This request is automatically authenticated via AuthContext defaults
                    const response = await axios.get(`${apiUrl}/api/students/by-id/${studentId}`);
                    setScannedStudent(response.data);
                } catch (err) {
                    console.error("Scan identification error:", err);
                    setError(err.response?.data?.message || `Student ID ${studentId} not found in your records.`);
                    // Reset after 3 seconds so teacher can try again
                    setTimeout(resetScanner, 3000);
                } finally {
                    setLoading(false);
                }
            }
        }
    };

    // --- Attendance Action ---
    const handleMarkPresent = async () => {
        setLoading(true); 
        setError(''); 
        setSuccess('');
        try { 
            const today = new Date().toISOString().split('T')[0]; 
            await axios.post(`${apiUrl}/api/attendance/mark`, { 
                studentId: scannedStudent._id, 
                date: today, 
                status: 'Present', 
                classGrade: scannedStudent.grade, 
                location: scannedStudent.location 
            }); 
            setSuccess(`${scannedStudent.name} marked as PRESENT.`); 
        } catch (err) { 
            setError(err.response?.data?.message || "Failed to mark attendance."); 
        } finally { 
            setLoading(false); 
        }
    };

    // --- Payment Action ---
    const handleMarkPaid = async () => {
        const amount = window.prompt(`Enter payment amount for ${scannedStudent.name}:`, '2000'); 
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;

        setLoading(true); 
        setError(''); 
        setSuccess(''); 
        try { 
            const today = new Date(); 
            const month = today.toLocaleString('default', { month: 'long' }); 
            const year = today.getFullYear(); 
            
            await axios.post(`${apiUrl}/api/payments/mark`, { 
                studentId: scannedStudent._id, 
                month, 
                year, 
                status: 'Paid', 
                amount: Number(amount) 
            }); 
            setSuccess(`${scannedStudent.name} paid LKR ${amount} for ${month}.`); 
        } catch (err) { 
            setError(err.response?.data?.message || "Failed to mark payment."); 
        } finally { 
            setLoading(false); 
        }
    };

    const resetScanner = () => {
        setScannedStudent(null); 
        setError(''); 
        setSuccess(''); 
        setLoading(false);
    };

    // --- View Logic ---

    // View 1: The Scanner Interface
    if (!scannedStudent) {
        return (
            <Container className="mt-4">
                <Row className="justify-content-center">
                    <Col md={8} lg={5}>
                        <Card className="shadow-sm border-0">
                            <Card.Header className="bg-dark text-white text-center py-3">
                                <h4 className="mb-0"><FaQrcode className="me-2" /> QR Check-in</h4>
                                <small className="opacity-75">{teacher?.instituteName}</small>
                            </Card.Header>
                            <Card.Body className="p-4">
                                {error && <Alert variant="danger" className="text-center py-2">{error}</Alert>}
                                {loading && <div className="text-center mb-3"><Spinner animation="grow" variant="primary" /></div>}

                                <div className="qr-wrapper rounded overflow-hidden border">
                                    <QrReader
                                        onResult={handleScanResult}
                                        constraints={{ facingMode: 'environment' }}
                                        containerStyle={{ width: '100%' }}
                                    />
                                </div>

                                <div className="text-center mt-4">
                                    <p className="text-muted small">Align the student's ID card QR code within the camera frame to auto-detect.</p>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        );
    }

    // View 2: Student Identification & Action Menu
    return (
        <Container className="mt-4">
            <Row className="justify-content-center">
                <Col md={8} lg={5}>
                    <Card className="shadow border-0">
                        <Card.Body className="p-4 text-center">
                            <div className="mb-4">
                                <div className="bg-light d-inline-block p-4 rounded-circle mb-3">
                                    <FaUser className="display-4 text-primary" />
                                </div>
                                <h3 className="fw-bold mb-1">{scannedStudent.name}</h3>
                                <Badge pill bg="info" className="px-3">{scannedStudent.studentId}</Badge>
                            </div>

                            <ListGroup variant="flush" className="text-start border rounded mb-4">
                                <ListGroup.Item className="d-flex justify-content-between">
                                    <span className="text-muted">Grade</span>
                                    <span className="fw-bold">{scannedStudent.grade}</span>
                                </ListGroup.Item>
                                <ListGroup.Item className="d-flex justify-content-between">
                                    <span className="text-muted">Primary Location</span>
                                    <span className="fw-bold">{scannedStudent.location}</span>
                                </ListGroup.Item>
                            </ListGroup>

                            {error && <Alert variant="danger">{error}</Alert>}
                            {success && <Alert variant="success" className="d-flex align-items-center justify-content-center">
                                <FaCheckCircle className="me-2" /> {success}
                            </Alert>}

                            <div className="d-grid gap-3">
                                <Button 
                                    variant="success" 
                                    size="lg" 
                                    className="py-3 fw-bold" 
                                    onClick={handleMarkPresent} 
                                    disabled={loading || success.includes('PRESENT')}
                                >
                                    {loading ? <Spinner size="sm" /> : 'Mark Attendance'}
                                </Button>
                                
                                <Button 
                                    variant="primary" 
                                    size="lg" 
                                    className="py-3 fw-bold" 
                                    onClick={handleMarkPaid} 
                                    disabled={loading || success.includes('PAID')}
                                >
                                    {loading ? <Spinner size="sm" /> : 'Record Fee Payment'}
                                </Button>

                                <Button variant="link" className="text-muted mt-2" onClick={resetScanner} disabled={loading}>
                                    <FaTimesCircle /> Cancel & Scan Next
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default ScanCheckInPage;