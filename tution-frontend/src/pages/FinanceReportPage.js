import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Form, Button, Card, Table, Spinner, Alert, Badge } from 'react-bootstrap';

const months = ["All", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const years = ["All", new Date().getFullYear(), new Date().getFullYear() - 1];

function FinanceReportPage() {
    const [month, setMonth] = useState('All');
    const [year, setYear] = useState(new Date().getFullYear());
    const [grade, setGrade] = useState('All');
    const [location, setLocation] = useState('All');

    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [locations, setLocations] = useState([]);
    const [locationLoading, setLocationLoading] = useState(true);

    useEffect(() => {
        const fetchLocations = async () => {
            setLocationLoading(true);
            setError('');
            try {
                const apiUrl = process.env.REACT_APP_API_URL;
                if (!apiUrl) throw new Error("API URL is not configured.");
                const res = await axios.get(`${apiUrl}/api/locations`);
                setLocations(res.data);
            } catch (err) {
                console.error("Failed to fetch locations:", err);
                setError(`Failed to load locations list: ${err.message}`);
            } finally {
                setLocationLoading(false);
            }
        };
        fetchLocations();
    }, []);

    const loadFinanceReport = async () => {
        setLoading(true);
        setError('');
        setReportData(null);
        try {
            const apiUrl = process.env.REACT_APP_API_URL;
            if (!apiUrl) throw new Error("API URL is not configured.");
            const response = await axios.get(`${apiUrl}/api/reports/finance`, {
                params: { month, year, grade, location }
            });
            setReportData(response.data);
        } catch (err) {
            console.error("Error loading finance report:", err);
            setError(`Error loading finance report: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container fluid className="mt-4">
            <Card className="mb-4">
                <Card.Body>
                    <Card.Title>Finance Report</Card.Title>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form>
                        <Row>
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
                            <Col md={2}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Location</Form.Label>
                                    <Form.Select value={location} onChange={(e) => setLocation(e.target.value)} disabled={locationLoading}>
                                        <option value="All">All Locations</option>
                                        {!locationLoading && locations.map(loc => <option key={loc._id} value={loc.name}>{loc.name}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={2} className="d-flex align-items-end mb-3">
                                <Button onClick={loadFinanceReport} className="w-100" disabled={loading || locationLoading}>
                                    {loading ? <Spinner as="span" size="sm" /> : 'Load Report'}
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            {loading && <div className="text-center"><Spinner animation="border" /></div>}

            {reportData && (
                <>
                    {/* Updated Row to show 3 cards */}
                    <Row className="mb-3">
                        <Col md={4}>
                            <Card className="text-center shadow-sm">
                                <Card.Header className="bg-success text-white">Total Income (LKR)</Card.Header>
                                <Card.Body>
                                    <Card.Title className="fs-3">{reportData.grandTotal?.totalIncome?.toLocaleString() || '0'}</Card.Title>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="text-center shadow-sm">
                                <Card.Header className="bg-primary text-white">Payments Received</Card.Header>
                                <Card.Body>
                                    <Card.Title className="fs-3">{reportData.grandTotal?.totalStudentsPaid || '0'}</Card.Title>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="text-center shadow-sm border-danger">
                                <Card.Header className="bg-danger text-white">Unpaid Students Count</Card.Header>
                                <Card.Body>
                                    <Card.Title className="fs-3 text-danger">{reportData.unpaidCount || '0'}</Card.Title>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Breakdown Table */}
                    <Card className="mb-4 shadow-sm">
                        <Card.Header>Income Breakdown</Card.Header>
                        <Card.Body>
                            <Table striped bordered hover responsive>
                                <thead>
                                    <tr>
                                        <th>Year</th>
                                        <th>Month</th>
                                        <th>Grade</th>
                                        <th>Location</th>
                                        <th>Paid</th>
                                        <th>Income</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.breakdown?.length > 0 ? reportData.breakdown.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item._id.year}</td>
                                            <td>{item._id.month}</td>
                                            <td><Badge bg="primary">{item._id.grade}</Badge></td>
                                            <td><Badge bg="secondary">{item._id.location}</Badge></td>
                                            <td>{item.studentsPaid}</td>
                                            <td>{item.totalIncome?.toLocaleString()}</td>
                                        </tr>
                                    )) : <tr><td colSpan="6" className="text-center">No data found.</td></tr>}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>

                    {/* NEW: Unpaid Students Detailed Table */}
                    {reportData.unpaidStudents?.length > 0 && (
                        <Card className="shadow-sm border-danger">
                            <Card.Header className="bg-danger text-white d-flex justify-content-between">
                                <span>Unpaid Students List</span>
                                <Badge bg="light" text="dark">{reportData.unpaidCount} Pending</Badge>
                            </Card.Header>
                            <Card.Body>
                                <Table striped bordered hover responsive>
                                    <thead className="table-danger">
                                        <tr>
                                            <th>Student ID</th>
                                            <th>Name</th>
                                            <th>Grade</th>
                                            <th>Location</th>
                                            <th>Contact Number</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.unpaidStudents.map((st) => (
                                            <tr key={st._id}>
                                                <td>{st.studentId}</td>
                                                <td>{st.name}</td>
                                                <td>{st.grade}</td>
                                                <td>{st.location}</td>
                                                <td>{st.ontactPhone || 'N/A'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    )}
                </>
            )}
            {!loading && !reportData && <Alert variant="info">Select filters and click "Load Report" to view data.</Alert>}
        </Container>
    );
}

export default FinanceReportPage;