import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Form, Button, Card, ListGroup, Spinner, Alert, Tabs, Tab, Table, Badge } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext'; // Import Auth context

const getISODate = (date) => date.toISOString().split('T')[0];

function AttendancePage() {
    const { teacher } = useAuth(); // Access global teacher state

    // --- Take Attendance State ---
    const [takeGrade, setTakeGrade] = useState('Grade 6');
    const [takeLocation, setTakeLocation] = useState('');
    const [takeDate, setTakeDate] = useState(getISODate(new Date()));
    const [studentsForClass, setStudentsForClass] = useState([]);
    const [attendanceStatus, setAttendanceStatus] = useState({});
    const [takeLoading, setTakeLoading] = useState(false);
    const [takeError, setTakeError] = useState('');

    // --- Shared & Initial State ---
    const [locations, setLocations] = useState([]);
    const [locationLoading, setLocationLoading] = useState(true);
    const [locationError, setLocationError] = useState('');
    const [allActiveStudents, setAllActiveStudents] = useState([]);
    const [studentsLoading, setStudentsLoading] = useState(true);

    // --- Report State ---
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [studentRecords, setStudentRecords] = useState([]);
    const [reportLoading, setReportLoading] = useState(false);
    const [reportError, setReportError] = useState('');
    const [reportStartDate, setReportStartDate] = useState('');
    const [reportEndDate, setReportEndDate] = useState('');
    const [reportGradeFilter, setReportGradeFilter] = useState('All');
    const [reportLocationFilter, setReportLocationFilter] = useState('All');
    const [reportNameFilter, setReportNameFilter] = useState('');
    const [filteredStudentsForReport, setFilteredStudentsForReport] = useState([]);
    const [filterApplied, setFilterApplied] = useState(false);

    const apiUrl = process.env.REACT_APP_API_URL;

    // --- Initial Secure Data Fetch ---
    useEffect(() => {
        const fetchData = async () => {
            if (!teacher) return;
            
            setLocationLoading(true); 
            setStudentsLoading(true);
            
            try {
                // 1. Fetch Teacher's Locations
                const locRes = await axios.get(`${apiUrl}/api/locations`);
                setLocations(locRes.data);
                if (locRes.data.length > 0 && !takeLocation) {
                    setTakeLocation(locRes.data[0].name);
                }

                // 2. Fetch Teacher's Active Students
                const stuRes = await axios.get(`${apiUrl}/api/students`);
                setAllActiveStudents(stuRes.data);
                setFilteredStudentsForReport(stuRes.data);
            } catch (err) {
                console.error("Initialization error:", err);
                setLocationError("Failed to synchronize your account data.");
            } finally {
                setLocationLoading(false);
                setStudentsLoading(false);
            }
        };
        fetchData();
    }, [teacher, apiUrl]);

    // --- Mark Attendance (Auth-Aware) ---
    const handleLoadClass = async () => {
        setTakeLoading(true); setTakeError(''); setStudentsForClass([]); setAttendanceStatus({});
        if (!takeLocation) {
            setTakeError('Please select a location first.');
            setTakeLoading(false);
            return;
        }
        try {
            const stuRes = await axios.get(`${apiUrl}/api/students`, { params: { grade: takeGrade, location: takeLocation } });
            setStudentsForClass(stuRes.data);
            
            const attRes = await axios.get(`${apiUrl}/api/attendance/class`, { params: { date: takeDate, grade: takeGrade, location: takeLocation } });
            const map = attRes.data.reduce((acc, rec) => { if (rec.student?._id) acc[rec.student._id] = rec.status; return acc; }, {});
            setAttendanceStatus(map);
        } catch (err) {
             setTakeError(err.response?.data?.message || 'Error loading class data.');
        } finally { setTakeLoading(false); }
    };

    const handleMarkAttendance = async (studentId, status) => {
        setAttendanceStatus(prev => ({ ...prev, [studentId]: status }));
        try {
            await axios.post(`${apiUrl}/api/attendance/mark`, { 
                studentId, date: takeDate, status, classGrade: takeGrade, location: takeLocation 
            });
        } catch (err) {
             setTakeError('Failed to sync record. Please try again.');
             setAttendanceStatus(prev => { const curr = {...prev}; delete curr[studentId]; return curr; });
        }
    };

    // --- Report Logic (Auth-Aware) ---
    const handleFilterStudentsForReport = () => {
        setReportError('');
        const filtered = allActiveStudents.filter(student => {
            const gradeMatch = reportGradeFilter === 'All' || student.grade === reportGradeFilter;
            const locationMatch = reportLocationFilter === 'All' || student.location === reportLocationFilter;
            const nameMatch = !reportNameFilter || student.name.toLowerCase().includes(reportNameFilter.toLowerCase());
            return gradeMatch && locationMatch && nameMatch;
        });
        setFilteredStudentsForReport(filtered);
        setSelectedStudentId('');
        setFilterApplied(true);
    };

    useEffect(() => {
        const fetchStudentAttendance = async () => {
            if (!selectedStudentId) return;
            setReportLoading(true); 
            try {
                const params = {
                    startDate: reportStartDate || undefined,
                    endDate: reportEndDate || undefined
                };
                const response = await axios.get(`${apiUrl}/api/attendance/student/${selectedStudentId}`, { params });
                setStudentRecords(response.data);
            } catch (err) {
                setReportError('Could not retrieve specific attendance records.');
            } finally { setReportLoading(false); }
        };
        fetchStudentAttendance();
    }, [selectedStudentId, reportStartDate, reportEndDate, apiUrl]);

    const handleReportFilterChange = (setter) => (e) => {
        setter(e.target.value);
        setFilterApplied(false);
        setSelectedStudentId('');
    };

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

    return (
        <Container className="mt-4 pb-5">
            <div className="mb-4">
                <h2 className="fw-bold">Attendance Management</h2>
                <p className="text-muted">Recording logs for: <strong>{teacher?.instituteName}</strong></p>
            </div>

            <Tabs defaultActiveKey="takeAttendance" className="custom-tabs mb-4">
                <Tab eventKey="takeAttendance" title="Manual Check-in">
                   <Card className="shadow-sm border-0 mb-4">
                       <Card.Body className="p-4">
                            {locationError && <Alert variant="danger" size="sm">{locationError}</Alert>}
                            <Form>
                                <Row className="g-3">
                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label className="small fw-bold">Select Grade</Form.Label>
                                            <Form.Select value={takeGrade} onChange={(e) => setTakeGrade(e.target.value)}>
                                                <option value="Grade 6">Grade 6</option><option value="Grade 7">Grade 7</option>
                                                <option value="Grade 8">Grade 8</option><option value="Grade 9">Grade 9</option>
                                                <option value="Grade 10">Grade 10</option><option value="Grade 11">Grade 11</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label className="small fw-bold">Location</Form.Label>
                                            <Form.Select value={takeLocation} onChange={(e) => setTakeLocation(e.target.value)} disabled={locationLoading}>
                                                {locations.map(loc => (<option key={loc._id} value={loc.name}>{loc.name}</option>))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Group>
                                            <Form.Label className="small fw-bold">Session Date</Form.Label>
                                            <Form.Control type="date" value={takeDate} onChange={(e) => setTakeDate(e.target.value)} />
                                        </Form.Group>
                                    </Col>
                                    <Col md={3} className="d-flex align-items-end">
                                        <Button onClick={handleLoadClass} className="w-100 fw-bold" variant="primary" disabled={takeLoading}>
                                            {takeLoading ? <Spinner size="sm" /> : 'Load Batch'}
                                        </Button>
                                    </Col>
                                </Row>
                            </Form>
                       </Card.Body>
                   </Card>

                   {takeError && <Alert variant="warning">{takeError}</Alert>}

                   {!takeLoading && studentsForClass.length > 0 && (
                       <Card className="shadow-sm border-0">
                           <ListGroup variant="flush">
                               {studentsForClass.map(student => {
                                   const status = attendanceStatus[student._id];
                                   return (
                                       <ListGroup.Item key={student._id} className="d-flex justify-content-between align-items-center py-3 px-4">
                                           <div>
                                               <div className="fw-bold">{student.name}</div>
                                               <small className="text-muted">ID: {student.studentId}</small>
                                           </div>
                                           <div className="btn-group">
                                               <Button variant={status === 'Present' ? 'success' : 'outline-success'} size="sm" onClick={() => handleMarkAttendance(student._id, 'Present')}>Present</Button>
                                               <Button variant={status === 'Absent' ? 'danger' : 'outline-danger'} size="sm" onClick={() => handleMarkAttendance(student._id, 'Absent')}>Absent</Button>
                                           </div>
                                       </ListGroup.Item>
                                   );
                               })}
                           </ListGroup>
                       </Card>
                   )}
                </Tab>

                <Tab eventKey="studentReport" title="Attendance History">
                     <Card className="shadow-sm border-0">
                        <Card.Body className="p-4">
                            <Form className="mb-4 p-3 bg-light rounded border">
                                <Row className="g-2 align-items-end">
                                    <Col md={2}><Form.Group><Form.Label className="small fw-bold">Grade</Form.Label><Form.Select size="sm" value={reportGradeFilter} onChange={handleReportFilterChange(setReportGradeFilter)}><option value="All">All</option><option value="Grade 6">Grade 6</option><option value="Grade 11">Grade 11</option></Form.Select></Form.Group></Col>
                                    <Col md={3}><Form.Group><Form.Label className="small fw-bold">Location</Form.Label><Form.Select size="sm" value={reportLocationFilter} onChange={handleReportFilterChange(setReportLocationFilter)} disabled={locationLoading}>{locations.map(loc => (<option key={loc._id} value={loc.name}>{loc.name}</option>))}</Form.Select></Form.Group></Col>
                                    <Col md={4}><Form.Group><Form.Label className="small fw-bold">Search Name</Form.Label><Form.Control size="sm" type="text" placeholder="Student name..." value={reportNameFilter} onChange={handleReportFilterChange(setReportNameFilter)} /></Form.Group></Col>
                                    <Col md={3}><Button size="sm" variant="dark" onClick={handleFilterStudentsForReport} className="w-100">Filter Students</Button></Col>
                                </Row>
                            </Form>

                            <Row className="g-3 mb-4">
                                <Col md={6}>
                                    <Form.Label className="small fw-bold">Choose Student</Form.Label>
                                    <Form.Select 
                                        value={selectedStudentId} 
                                        onChange={(e) => setSelectedStudentId(e.target.value)}
                                        disabled={!filterApplied || filteredStudentsForReport.length === 0}
                                    >
                                        <option value="">-- Select Student --</option>
                                        {filteredStudentsForReport.map(s => <option key={s._id} value={s._id}>{s.name} ({s.studentId})</option>)}
                                    </Form.Select>
                                </Col>
                                <Col md={3}>
                                    <Form.Label className="small fw-bold">Start Date</Form.Label>
                                    <Form.Control type="date" size="sm" value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)} disabled={!selectedStudentId}/>
                                </Col>
                                <Col md={3}>
                                    <Form.Label className="small fw-bold">End Date</Form.Label>
                                    <Form.Control type="date" size="sm" value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)} disabled={!selectedStudentId}/>
                                </Col>
                            </Row>

                            {reportLoading ? <div className="text-center py-4"><Spinner animation="border" variant="primary"/></div> : (
                                selectedStudentId && (
                                    <Table striped borderless hover responsive className="mt-3">
                                        <thead className="table-light"><tr><th>Date</th><th>Status</th><th>Grade</th><th>Venue</th></tr></thead>
                                        <tbody>
                                            {studentRecords.length > 0 ? studentRecords.map(rec => (
                                                <tr key={rec._id}>
                                                    <td>{formatDate(rec.date)}</td>
                                                    <td><Badge bg={rec.status === 'Present' ? 'success' : 'danger'}>{rec.status}</Badge></td>
                                                    <td>{rec.classGrade}</td>
                                                    <td>{rec.location}</td>
                                                </tr>
                                            )) : <tr><td colSpan="4" className="text-center text-muted py-4">No records found.</td></tr>}
                                        </tbody>
                                    </Table>
                                )
                            )}
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>
        </Container>
    );
}

export default AttendancePage;