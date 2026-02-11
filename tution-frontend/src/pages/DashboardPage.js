import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext'; 

// --- CHART IMPORTS ---
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

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

function DashboardPage() {
    const { teacher } = useAuth(); 
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const apiUrl = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const fetchDashboardData = async () => {
            setError('');
            setLoading(true);
            try {
                if (!apiUrl) {
                    throw new Error("API URL configuration error. Please check your environment variables.");
                }
                const response = await axios.get(`${apiUrl}/api/dashboard`);
                setDashboardData(response.data);
            } catch (err) {
                console.error("Dashboard Fetch Error:", err);
                setError(err.response?.data?.message || 'Failed to load your dashboard stats.');
            } finally {
                setLoading(false);
            }
        };

        if (teacher) fetchDashboardData();
    }, [teacher, apiUrl]);

    // --- Chart Helpers ---
    const prepareGradeChartData = () => {
        if (!dashboardData?.totalStudentsByGrade) return {};
        const labels = dashboardData.totalStudentsByGrade.map(item => item._id);
        const data = dashboardData.totalStudentsByGrade.map(item => item.count);
        return {
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } },
            data: { labels, datasets: [{ label: 'Students per Grade', data, backgroundColor: 'rgba(54, 162, 235, 0.8)', borderRadius: 4 }] }
        };
    };

    const preparePaymentDoughnutData = () => {
        if (!dashboardData?.paymentStatusThisMonth) return {};
        const labels = dashboardData.paymentStatusThisMonth.map(item => item._id);
        const data = dashboardData.paymentStatusThisMonth.map(item => item.count);
        return {
            options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom' } } },
            data: { labels, datasets: [{ label: 'Payment Status', data, backgroundColor: ['rgba(75, 192, 192, 0.8)', 'rgba(255, 206, 86, 0.8)', 'rgba(255, 99, 132, 0.8)'], borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 206, 86, 1)', 'rgba(255, 99, 132, 1)'], borderWidth: 1 }] }
        };
    };

    if (loading) return <Container className="text-center mt-5"><Spinner animation="border" variant="primary" /></Container>;
    if (error) return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;
    if (!dashboardData) return null;

    const totalPending = dashboardData.paymentStatusThisMonth?.find(s => s._id === 'Pending')?.count || 0;
    const gradeChart = prepareGradeChartData();
    const paymentChart = preparePaymentDoughnutData();

    return (
        <Container fluid className="mt-4 px-4">
            <Row className="mb-4">
                <Col>
                    {/* UPDATED: Greets by First Name */}
                    <h2 className="fw-bold">Welcome, {teacher?.firstName}!</h2>
                    <p className="text-muted">Viewing dashboard for <strong>{teacher?.instituteName}</strong></p>
                </Col>
            </Row>

            {/* --- CORE STATS --- */}
            <Row className="mb-4">
                <Col lg={4} md={6} className="mb-3">
                    <Card bg="primary" text="white" className="shadow-sm border-0">
                        <Card.Body className="p-4 d-flex align-items-center">
                            <BsPeopleFill className="display-4 me-3 opacity-50" />
                            <div>
                                <small className="text-uppercase fw-bold opacity-75">Active Students</small>
                                <h2 className="mb-0 fw-bold">{dashboardData.totalStudents ?? 0}</h2>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={4} md={6} className="mb-3">
                    <Card bg="success" text="white" className="shadow-sm border-0">
                        <Card.Body className="p-4 d-flex align-items-center">
                            <BsPersonCheckFill className="display-4 me-3 opacity-50" />
                            <div>
                                <small className="text-uppercase fw-bold opacity-75">Present Today</small>
                                <h2 className="mb-0 fw-bold">{dashboardData.presentToday ?? 0}</h2>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={4} md={6} className="mb-3">
                    <Card bg="warning" text="dark" className="shadow-sm border-0">
                        <Card.Body className="p-4 d-flex align-items-center">
                            <BsClockHistory className="display-4 me-3 opacity-50" />
                            <div>
                                <small className="text-uppercase fw-bold opacity-75">Fees Pending</small>
                                <h2 className="mb-0 fw-bold">{totalPending}</h2>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* --- INCOME --- */}
            <Row className="mb-4">
                <Col md={6} className="mb-3">
                    <Card className="shadow-sm border-0 bg-light">
                        <Card.Body className="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 className="text-muted mb-1">Monthly Revenue</h6>
                                <h3 className="text-primary fw-bold">LKR {(dashboardData.totalIncomeThisMonth ?? 0).toLocaleString()}</h3>
                            </div>
                            <FaDollarSign className="fs-1 text-primary opacity-25" />
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6} className="mb-3">
                    <Card className="shadow-sm border-0 bg-light">
                        <Card.Body className="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 className="text-muted mb-1">Annual Revenue</h6>
                                <h3 className="text-dark fw-bold">LKR {(dashboardData.totalIncomeThisYear ?? 0).toLocaleString()}</h3>
                            </div>
                            <FaRegCalendarAlt className="fs-1 text-dark opacity-25" />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* --- CHARTS --- */}
            <Row>
                <Col xl={8} className="mb-4">
                    <Card className="shadow-sm border-0 h-100">
                        <Card.Body className="p-4">
                            <h5 className="fw-bold mb-4">Students Distribution by Grade</h5>
                            <div style={{ height: '350px' }}>
                                <Bar data={gradeChart.data} options={gradeChart.options} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xl={4} className="mb-4">
                    <Card className="shadow-sm border-0 h-100">
                        <Card.Body className="p-4">
                            <h5 className="fw-bold mb-4">Payment Status Overview</h5>
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