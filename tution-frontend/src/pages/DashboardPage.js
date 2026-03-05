import React, { useState, useEffect } from 'react'; // Added useState, useEffect
import axios from 'axios';
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

    // --- CORRECTED useEffect ---
    useEffect(() => {
        const fetchDashboardData = async () => {
            // Reset error state on fetch attempt
            setError('');
            setLoading(true); // Ensure loading is true at the start
            try {
                // 1. Get the API URL from the environment variable
                const apiUrl = process.env.REACT_APP_API_URL;

                // 2. Log the URL being used (for debugging)
                console.log("Attempting API call to:", apiUrl); // Debug log

                // 3. Check if the URL is actually defined
                if (!apiUrl) {
                    console.error("ERROR: REACT_APP_API_URL is not defined!");
                    setError("API URL configuration error. Please check Vercel environment variables or local .env file."); // Updated error message
                    setLoading(false);
                    return; // Stop execution if URL is missing
                }

                // 4. Use the apiUrl variable in the axios request
                const response = await axios.get(`${apiUrl}/api/dashboard`); // Use template literal `${...}`

                setDashboardData(response.data);

            } catch (err) {
                console.error("Error fetching dashboard data:", err); // Log the actual error
                let errorMsg = 'Error fetching dashboard data.';
                if (err.response) {
                    errorMsg += ` Server responded with ${err.response.status}.`;
                } else if (err.request) {
                    errorMsg += ` No response from server. Check API URL (${process.env.REACT_APP_API_URL || 'Not Set'}) and backend CORS settings.`; // Show URL in error
                } else {
                    errorMsg += ` Request setup error: ${err.message}`;
                }
                setError(errorMsg);
            } finally {
                setLoading(false); // Ensure loading is set to false even if there's an error
            }
        };

        fetchDashboardData();
    }, []); // Empty dependency array means run once on mount
    // --- END CORRECTED useEffect ---


    // --- Chart Helpers (Unchanged) ---
    const prepareGradeChartData = () => { /* ... unchanged ... */
        if (!dashboardData || !dashboardData.totalStudentsByGrade) return {}; const labels = dashboardData.totalStudentsByGrade.map(item => item._id); const data = dashboardData.totalStudentsByGrade.map(item => item.count); return { options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', } }, scales: { y: { beginAtZero: true } }, }, data: { labels, datasets: [{ label: 'Students per Grade', data, backgroundColor: 'rgba(54, 162, 235, 0.8)', borderRadius: 4, }] } };
    };
    const preparePaymentDoughnutData = () => { /* ... unchanged ... */
        if (!dashboardData || !dashboardData.paymentStatusThisMonth) return {}; const labels = dashboardData.paymentStatusThisMonth.map(item => item._id); const data = dashboardData.paymentStatusThisMonth.map(item => item.count); return { options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom', } }, }, data: { labels, datasets: [{ label: 'Payment Status', data, backgroundColor: ['rgba(75, 192, 192, 0.8)', 'rgba(255, 206, 86, 0.8)', 'rgba(255, 99, 132, 0.8)'], borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 206, 86, 1)', 'rgba(255, 99, 132, 1)'], borderWidth: 1, }] } };
    };
    // --- End Chart Helpers ---


    // --- Render Logic ---
    if (loading) {
        return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
    }
    // Show error FIRST if it exists
    if (error) {
        return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;
    }
    // THEN handle case where data is simply null/undefined after loading without error
    if (!dashboardData) {
         return <Container className="mt-5"><Alert variant="warning">No dashboard data loaded. The backend might be starting up or returned empty data.</Alert></Container>;
     }

    // Safely calculate totalPending only if dashboardData exists
    const totalPending = dashboardData.paymentStatusThisMonth?.find(s => s._id === 'Pending')?.count || 0;
    // Prepare chart data only if dashboardData exists
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

            {/* --- ROW 1: CORE STATS --- */}
            <Row>
                <Col lg={4} md={6} className="mb-3">
                    <Card bg="primary" text="white" className="shadow border-0 h-100">
                        <Card.Body className="d-flex align-items-center">
                            <BsPeopleFill className="fs-1 me-4" />
                            <div>
                                <div className="fs-6">Total Active Students</div>
                                <div className="fs-2 fw-bold">{dashboardData.totalStudents ?? 'N/A'}</div> {/* Handle potential null */}
                            </div>
                        </Card.Body>
                        {dashboardData.totalStudentsByGrade && dashboardData.totalStudentsByGrade.length > 0 && (
                            <ListGroup variant="flush"> {dashboardData.totalStudentsByGrade.map(item => ( <ListGroup.Item key={item._id} className="d-flex justify-content-between align-items-center text-dark">{item._id || 'N/A'}<span className="badge bg-primary rounded-pill">{item.count}</span></ListGroup.Item> ))} </ListGroup>
                        )}
                    </Card>
                </Col>
                <Col lg={4} md={6} className="mb-3">
                    <Card bg="success" text="white" className="shadow border-0 h-100">
                        <Card.Body className="d-flex align-items-center">
                            <BsPersonCheckFill className="fs-1 me-4" />
                            <div>
                                <div className="fs-6">Students Present Today</div>
                                <div className="fs-2 fw-bold">{dashboardData.presentToday ?? 'N/A'}</div> {/* Handle potential null */}
                            </div>
                        </Card.Body>
                        {dashboardData.presentTodayByGrade && dashboardData.presentTodayByGrade.length > 0 && (
                            <ListGroup variant="flush"> {dashboardData.presentTodayByGrade.map(item => ( <ListGroup.Item key={item._id} className="d-flex justify-content-between align-items-center text-dark">{item._id || 'N/A'}<span className="badge bg-success rounded-pill">{item.count}</span></ListGroup.Item> ))} </ListGroup>
                        )}
                    </Card>
                </Col>
                <Col lg={4} md={6} className="mb-3">
                    <Card bg="warning" text="dark" className="shadow border-0 h-100">
                        <Card.Body className="d-flex align-items-center">
                            <BsClockHistory className="fs-1 me-4" />
                            <div>
                                <div className="fs-6">Pending Payments</div>
                                <div className="fs-2 fw-bold">{totalPending}</div> {/* Already defaults to 0 */}
                            </div>
                        </Card.Body>
                        {dashboardData.pendingPaymentsByGrade && dashboardData.pendingPaymentsByGrade.length > 0 && (
                            <ListGroup variant="flush"> {dashboardData.pendingPaymentsByGrade.map(item => ( <ListGroup.Item key={item._id} className="d-flex justify-content-between align-items-center text-dark">{item._id || 'N/A'}<span className="badge bg-warning text-dark rounded-pill">{item.count}</span></ListGroup.Item> ))} </ListGroup>
                        )}
                    </Card>
                </Col>
            </Row>

            {/* --- ROW 2: INCOME STATS --- */}
            <Row>
                <Col md={6} className="mb-3">
                    <Card bg="info" text="white" className="shadow border-0 h-100">
                        <Card.Body className="d-flex align-items-center">
                            <FaDollarSign className="fs-1 me-4" />
                            <div>
                                <div className="fs-6">Income (This Month)</div>
                                <div className="fs-2 fw-bold">LKR {(dashboardData.totalIncomeThisMonth ?? 0).toLocaleString()}</div> {/* Handle potential null */}
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
                                <div className="fs-2 fw-bold">LKR {(dashboardData.totalIncomeThisYear ?? 0).toLocaleString()}</div> {/* Handle potential null */}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* --- ROW 3: CHARTS --- */}
            <Row>
                <Col md={8} className="mb-3">
                    <Card className="shadow-sm border-0 h-100">
                        <Card.Body>
                            <Card.Title>Students by Grade</Card.Title>
                            {/* Check if gradeChart data exists */}
                            {gradeChart.data?.datasets?.length > 0 ? (
                                <div style={{ height: '350px' }}>
                                    <Bar data={gradeChart.data} options={gradeChart.options} />
                                </div>
                            ) : (<p>No student data available for chart.</p>)}
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4} className="mb-3">
                    <Card className="shadow-sm border-0 h-100">
                        <Card.Body>
                            <Card.Title>Payment Status (This Month)</Card.Title>
                             {/* Check if paymentChart data exists */}
                            {paymentChart.data?.datasets?.length > 0 ? (
                                <div style={{ height: '350px' }}>
                                    <Doughnut data={paymentChart.data} options={paymentChart.options} />
                                </div>
                             ) : (<p>No payment data available for chart.</p>)}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default DashboardPage;