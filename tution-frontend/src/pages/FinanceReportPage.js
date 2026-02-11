import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Form, Button, Card, Table, Spinner, Alert, Badge } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext'; // Import the Auth hook
import { FaFileInvoiceDollar, FaChartLine, FaFilter } from 'react-icons/fa';

const months = ["All", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const currentYear = new Date().getFullYear();
const years = ["All", currentYear, currentYear - 1, currentYear - 2];

function FinanceReportPage() {
    const { teacher } = useAuth(); // Access global teacher identity
    
    // --- State for Filters ---
    const [month, setMonth] = useState('All');
    const [year, setYear] = useState(currentYear);
    const [grade, setGrade] = useState('All');
    const [location, setLocation] = useState('All');

    // --- State for Data ---
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [locations, setLocations] = useState([]);
    const [locationLoading, setLocationLoading] = useState(true);

    const apiUrl = process.env.REACT_APP_API_URL;

    // --- Initial Secure Data Fetch ---
    useEffect(() => {
        const fetchLocations = async () => {
            setLocationLoading(true);
            setError(''); 
            try {
                if (!apiUrl) throw new Error("API URL is not configured.");
                // Token is handled by the axios interceptor
                const res = await axios.get(`${apiUrl}/api/locations`); 
                setLocations(res.data);
            } catch (err) {
                console.error("Failed to fetch locations:", err);
                setError(`Configuration Error: ${err.response?.data?.message || err.message}`); 
            } finally {
                setLocationLoading(false);
            }
        };

        if (teacher) fetchLocations();
    }, [teacher, apiUrl]);

    // --- Load Secure Report ---
    const loadFinanceReport = async () => {
        setLoading(true);
        setError('');
        setReportData(null);
        try {
            if (!apiUrl) throw new Error("API URL is not configured.");
            
            // This GET request is secured by the teacher's JWT token
            const response = await axios.get(`${apiUrl}/api/reports/finance`, {
                params: { month, year, grade, location }
            });
            setReportData(response.data);
        } catch (err) {
            console.error("Error loading finance report:", err);
            setError(`Report Error: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container fluid className="mt-4 px-4 pb-5">
            <div className="mb-4 d-flex align-items-center justify-content-between">
                <div>
                    <h2 className="fw-bold"><FaFileInvoiceDollar className="me-2 text-primary" /> Finance & Revenue</h2>
                    <p className="text-muted mb-0">Analytics for <strong>{teacher?.instituteName}</strong></p>
                </div>
            </div>

            <Card className="shadow-sm border-0 mb-4">
                <Card.Body className="p-4">
                    <h5 className="mb-3 fw-bold text-secondary"><FaFilter className="me-2" /> Report Filters</h5>
                    <Form>
                        <Row className="g-3">
                            <Col md={3} lg={2}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold">Month</Form.Label>
                                    <Form.Select value={month} onChange={(e) => setMonth(e.target.value)}>
                                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={2} lg={2}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold">Year</Form.Label>
                                    <Form.Select value={year} onChange={(e) => setYear(e.target.value)}>
                                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3} lg={2}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold">Grade</Form.Label>
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
                            <Col md={2} lg={3}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold">Location</Form.Label>
                                    <Form.Select
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        disabled={locationLoading}
                                    >
                                        <option value="All">All Locations</option>
                                        {locations.map(loc => (
                                            <option key={loc._id} value={loc.name}>{loc.name}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={2} lg={3} className="d-flex align-items-end">
                                <Button onClick={loadFinanceReport} variant="primary" className="w-100 fw-bold shadow-sm" disabled={loading || locationLoading}>
                                    {loading ? <Spinner as="span" size="sm" /> : <><FaChartLine className="me-2" /> Generate Report</>}
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            {error && <Alert variant="danger" className="shadow-sm">{error}</Alert>}

            {reportData && (
                <>
                    <Row className="mb-4 g-3">
                        <Col md={6}>
                            <Card className="text-center shadow-sm border-0 bg-primary text-white">
                                <Card.Body className="p-4">
                                    <h6 className="text-uppercase small opacity-75">Net Revenue Collected</h6>
                                    <h2 className="display-6 fw-bold mb-0">
                                        LKR {reportData.grandTotal?.totalIncome?.toLocaleString() || '0'}
                                    </h2>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={6}>
                            <Card className="text-center shadow-sm border-0 bg-dark text-white">
                                <Card.Body className="p-4">
                                    <h6 className="text-uppercase small opacity-75">Successful Transactions</h6>
                                    <h2 className="display-6 fw-bold mb-0">
                                        {reportData.grandTotal?.totalStudentsPaid || '0'}
                                    </h2>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <Card className="shadow-sm border-0 rounded overflow-hidden">
                        <Card.Header className="bg-white py-3 border-0">
                            <h5 className="mb-0 fw-bold">Revenue Breakdown</h5>
                        </Card.Header>
                        <Table hover responsive className="mb-0 border-top">
                            <thead className="table-light">
                                <tr>
                                    <th>Period</th>
                                    <th>Class Details</th>
                                    <th>Venue</th>
                                    <th className="text-center">Count</th>
                                    <th className="text-end pe-4">Income (LKR)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.breakdown && reportData.breakdown.length > 0 ? (
                                    reportData.breakdown.map((item, index) => (
                                        <tr key={index}>
                                            <td className="align-middle">
                                                <div className="fw-bold">{item._id.month}</div>
                                                <small className="text-muted">{item._id.year}</small>
                                            </td>
                                            <td className="align-middle">
                                                <Badge bg="primary">{item._id.grade}</Badge>
                                            </td>
                                            <td className="align-middle">
                                                <Badge bg="secondary" pill>{item._id.location}</Badge>
                                            </td>
                                            <td className="align-middle text-center">{item.studentsPaid}</td>
                                            <td className="align-middle text-end pe-4 fw-bold">
                                                {item.totalIncome != null ? item.totalIncome.toLocaleString() : '0'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center py-5 text-muted italic">No financial data found for the selected period.</td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </Card>
                </>
            )}

            {!loading && !reportData && !error && (
                <div className="text-center py-5 border rounded bg-white shadow-sm mt-4">
                    <p className="mb-0 text-muted fs-5">Configure your report filters and click <strong>Generate Report</strong>.</p>
                </div>
            )}
        </Container>
    );
}

export default FinanceReportPage;