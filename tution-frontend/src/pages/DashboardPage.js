import React, { useState, useEffect } from 'react';
import axios from 'axios';
// --- ADD ListGroup TO THE IMPORT ---
import { Container, Row, Col, Card, Spinner, Alert, ListGroup } from 'react-bootstrap';

// --- IMPORTS ---
import { Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { BsPeopleFill, BsPersonCheckFill, BsClockHistory } from 'react-icons/bs';
import { FaDollarSign, FaRegCalendarAlt } from 'react-icons/fa'; 

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);
// --- END IMPORTS ---


function DashboardPage() {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/dashboard');
                setDashboardData(response.data);
                setLoading(false);
            } catch (err) {
                setError('Error fetching dashboard data.');
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // (All chart helper functions are identical - no changes)
    const prepareGradeChartData = () => {
        if (!dashboardData || !dashboardData.totalStudentsByGrade) return {};
        const labels = dashboardData.totalStudentsByGrade.map(item => item._id);
        const data = dashboardData.totalStudentsByGrade.map(item => item.count);
        return {
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', } }, scales: { y: { beginAtZero: true } }, },
            data: { labels, datasets: [{ label: 'Students per Grade', data, backgroundColor: 'rgba(54, 162, 235, 0.8)', borderRadius: 4, }] }
        };
    };
    const preparePaymentDoughnutData = () => {
        if (!dashboardData || !dashboardData.paymentStatusThisMonth) return {};
        const labels = dashboardData.paymentStatusThisMonth.map(item => item._id);
        const data = dashboardData.paymentStatusThisMonth.map(item => item.count);
        return {
            options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom', } }, },
            data: { labels, datasets: [{ label: 'Payment Status', data, backgroundColor: ['rgba(75, 192, 192, 0.8)', 'rgba(255, 206, 86, 0.8)', 'rgba(255, 99, 132, 0.8)'], borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 206, 86, 1)', 'rgba(255, 99, 132, 1)'], borderWidth: 1, }] }
        };
    };
    // (End of chart helpers)


    if (loading) {
        return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
    }
    if (error) {
        return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;
    }
    if (!dashboardData) {
        return <Container className="mt-5"><Alert variant="info">No dashboard data found.</Alert></Container>;
    }

    const totalPending = dashboardData.paymentStatusThisMonth?.find(s => s._id === 'Pending')?.count || 0;
    const gradeChart = prepareGradeChartData();
    const paymentChart = preparePaymentDoughnutData();

    return (
        <Container fluid className="mt-4">
            
            <Row className="mb-4">
                <Col>
                    <h2>Welcome back, Admin!</h2>
                    <p className="text-muted">Here's a summary of your operations.</p>
                </Col>
            </Row>

            {/* --- ROW 1: CORE STATS (MODIFIED) --- */}
            <Row>
                <Col lg={4} md={6} className="mb-3">
                    {/* --- Card 1: Total Students --- */}
                    <Card bg="primary" text="white" className="shadow border-0 h-100">
                        <Card.Body className="d-flex align-items-center">
                            <BsPeopleFill className="fs-1 me-4" />
                            <div>
                                <div className="fs-6">Total Active Students</div>
                                <div className="fs-2 fw-bold">{dashboardData.totalStudents}</div>
                            </div>
                        </Card.Body>
                        {/* --- ADDED THIS LIST --- */}
                        {dashboardData.totalStudentsByGrade && dashboardData.totalStudentsByGrade.length > 0 && (
                            <ListGroup variant="flush">
                                {dashboardData.totalStudentsByGrade.map(item => (
                                    <ListGroup.Item key={item._id} className="d-flex justify-content-between align-items-center text-dark">
                                        {item._id || 'N/A'}
                                        <span className="badge bg-primary rounded-pill">{item.count}</span>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        )}
                    </Card>
                </Col>

                <Col lg={4} md={6} className="mb-3">
                    {/* --- Card 2: Present Today --- */}
                    <Card bg="success" text="white" className="shadow border-0 h-100">
                        <Card.Body className="d-flex align-items-center">
                            <BsPersonCheckFill className="fs-1 me-4" />
                            <div>
                                <div className="fs-6">Students Present Today</div>
                                <div className="fs-2 fw-bold">{dashboardData.presentToday}</div>
                            </div>
                        </Card.Body>
                        {/* --- ADDED THIS LIST --- */}
                        {dashboardData.presentTodayByGrade && dashboardData.presentTodayByGrade.length > 0 && (
                            <ListGroup variant="flush">
                                {dashboardData.presentTodayByGrade.map(item => (
                                    <ListGroup.Item key={item._id} className="d-flex justify-content-between align-items-center text-dark">
                                        {item._id || 'N/A'}
                                        <span className="badge bg-success rounded-pill">{item.count}</span>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        )}
                    </Card>
                </Col>

                <Col lg={4} md={6} className="mb-3">
                    {/* --- Card 3: Pending Payments --- */}
                    <Card bg="warning" text="dark" className="shadow border-0 h-100">
                        <Card.Body className="d-flex align-items-center">
                            <BsClockHistory className="fs-1 me-4" />
                            <div>
                                <div className="fs-6">Pending Payments</div>
                                <div className="fs-2 fw-bold">{totalPending}</div>
                            </div>
                        </Card.Body>
                        {/* --- ADDED THIS LIST --- */}
                        {dashboardData.pendingPaymentsByGrade && dashboardData.pendingPaymentsByGrade.length > 0 && (
                            <ListGroup variant="flush">
                                {dashboardData.pendingPaymentsByGrade.map(item => (
                                    <ListGroup.Item key={item._id} className="d-flex justify-content-between align-items-center text-dark">
                                        {item._id || 'N/A'}
                                        <span className="badge bg-warning text-dark rounded-pill">{item.count}</span>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        )}
                    </Card>
                </Col>
            </Row>

            {/* --- ROW 2: INCOME STATS (No change) --- */}
            <Row>
                <Col md={6} className="mb-3">
                    <Card bg="info" text="white" className="shadow border-0 h-100">
                        <Card.Body className="d-flex align-items-center">
                            <FaDollarSign className="fs-1 me-4" />
                            <div>
                                <div className="fs-6">Income (This Month)</div>
                                <div className="fs-2 fw-bold">LKR {(dashboardData.totalIncomeThisMonth || 0).toLocaleString()}</div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6} className="mb-3">
                    <Card bg="dark" text="white" className="shadow border-0 h-100">
                        <Card.Body className="d-flex align-items-center">
                            <FaRegCalendarAlt className="fs-1 me-4" />
                            <div>
                                <div className="fs-6">Income (This Year)</div>
                                <div className="fs-2 fw-bold">LKR {(dashboardData.totalIncomeThisYear || 0).toLocaleString()}</div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* --- ROW 3: CHARTS (No change) --- */}
            <Row>
                <Col md={8} className="mb-3">
                    <Card className="shadow-sm border-0 h-100">
                        <Card.Body>
                            <Card.Title>Students by Grade</Card.Title>
                            <div style={{ height: '350px' }}>
                                <Bar data={gradeChart.data} options={gradeChart.options} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4} className="mb-3">
                    <Card className="shadow-sm border-0 h-100">
                        <Card.Body>
                            <Card.Title>Payment Status (This Month)</Card.Title>
                            <div style={{ height: '350px' }}>
                                <Doughnut data={paymentChart.data} options={paymentChart.options} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default DashboardPage;