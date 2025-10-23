import React, { useState, useEffect } from 'react'; // Added useEffect
import axios from 'axios';
import { Container, Row, Col, Form, Button, Card, Table, Spinner, Alert, Badge } from 'react-bootstrap';

// Helper array for month dropdown
const months = ["All", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const years = ["All", new Date().getFullYear(), new Date().getFullYear() - 1]; // Current & last year

function FinanceReportPage() {
    // --- State for Filters ---
    const [month, setMonth] = useState('All');
    const [year, setYear] = useState(new Date().getFullYear());
    const [grade, setGrade] = useState('All');
    const [location, setLocation] = useState('All');

    // --- State for Data ---
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false); // Loading for report data
    const [error, setError] = useState('');

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
                setError("Failed to load locations for filtering.");
                setLocationLoading(false);
            }
        };
        fetchLocations();
    }, []); // Runs once on mount

    // --- Load the Report from API (No Change) ---
    const loadFinanceReport = async () => {
        setLoading(true);
        setError('');
        setReportData(null);
        try {
            const response = await axios.get('http://localhost:5000/api/reports/finance', {
                params: { month, year, grade, location }
            });
            setReportData(response.data);
        } catch (err) {
            setError('Error loading finance report.');
            console.error(err);
        }
        setLoading(false);
    };

    return (
        <Container fluid className="mt-4">
            <Card className="mb-4">
                <Card.Body>
                    <Card.Title>Finance Report</Card.Title>
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
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Year</Form.Label>
                                    <Form.Select value={year} onChange={(e) => setYear(e.target.value)}>
                                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={2}>
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
                                <Button onClick={loadFinanceReport} className="w-100" disabled={loading || locationLoading}>
                                    {loading ? <Spinner as="span" size="sm" /> : 'Load Report'}
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            {/* --- Report Data Display (No Change) --- */}
            {loading && <div className="text-center"><Spinner animation="border" /></div>}
            
            {reportData && (
                <>
                    {/* Grand Totals */}
                    <Row className="mb-3">
                        <Col md={6}>
                            <Card className="text-center">
                                <Card.Header>Total Income (LKR)</Card.Header>
                                <Card.Body>
                                    <Card.Title>
                                        {reportData.grandTotal?.totalIncome?.toLocaleString() || '0'}
                                    </Card.Title>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={6}>
                            <Card className="text-center">
                                <Card.Header>Total Payments Received</Card.Header>
                                <Card.Body>
                                    <Card.Title>
                                        {reportData.grandTotal?.totalStudentsPaid || '0'}
                                    </Card.Title>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Breakdown Table */}
                    <Card>
                        <Card.Header>Income Breakdown</Card.Header>
                        <Card.Body>
                            <Table striped bordered hover responsive>
                                <thead>
                                    <tr>
                                        <th>Year</th>
                                        <th>Month</th>
                                        <th>Grade</th>
                                        <th>Location</th>
                                        <th>Students Paid</th>
                                        <th>Total Income (LKR)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.breakdown && reportData.breakdown.length > 0 ? (
                                        reportData.breakdown.map((item, index) => (
                                            <tr key={index}>
                                                <td>{item._id.year}</td>
                                                <td>{item._id.month}</td>
                                                <td><Badge bg="primary">{item._id.grade}</Badge></td>
                                                <td><Badge bg="secondary">{item._id.location}</Badge></td>
                                                <td>{item.studentsPaid}</td>
                                                <td>{item.totalIncome.toLocaleString()}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="text-center">No data found for these filters.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </>
            )}
        </Container>
    );
}

export default FinanceReportPage;