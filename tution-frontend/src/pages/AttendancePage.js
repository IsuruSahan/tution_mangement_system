import React, { useState, useEffect } from 'react';
import axios from 'axios';
// Removed InputGroup, kept Table, Badge etc. No chart imports needed.
import { Container, Row, Col, Form, Button, Card, ListGroup, Spinner, Alert, Tabs, Tab, Table, Badge } from 'react-bootstrap';
// Chart imports are removed

const getISODate = (date) => date.toISOString().split('T')[0];

function AttendancePage() {
    // --- State for "Take Attendance" Tab ---
    const [takeGrade, setTakeGrade] = useState('Grade 6');
    const [takeLocation, setTakeLocation] = useState('');
    const [takeDate, setTakeDate] = useState(getISODate(new Date()));
    const [studentsForClass, setStudentsForClass] = useState([]);
    const [attendanceStatus, setAttendanceStatus] = useState({});
    const [takeLoading, setTakeLoading] = useState(false);
    const [takeError, setTakeError] = useState('');

    // --- State for Locations Dropdown (Shared) ---
    const [locations, setLocations] = useState([]);
    const [locationLoading, setLocationLoading] = useState(true);
    const [locationError, setLocationError] = useState(''); // Specific error for locations

    // --- State for All Active Students (Shared for Report Tab Filter) ---
    const [allActiveStudents, setAllActiveStudents] = useState([]);
    const [studentsLoading, setStudentsLoading] = useState(true); // Loading state for all students

    // --- State for Student Report Tab ---
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [studentRecords, setStudentRecords] = useState([]);
    const [reportLoading, setReportLoading] = useState(false); // Loading state for student report
    const [reportError, setReportError] = useState('');
    const [reportStartDate, setReportStartDate] = useState('');
    const [reportEndDate, setReportEndDate] = useState('');
    const [reportGradeFilter, setReportGradeFilter] = useState('All');
    const [reportLocationFilter, setReportLocationFilter] = useState('All');
    const [reportNameFilter, setReportNameFilter] = useState('');
    const [filteredStudentsForReport, setFilteredStudentsForReport] = useState([]);

    // --- Fetch locations AND all students on initial load ---
    useEffect(() => {
        const fetchData = async () => {
            setLocationLoading(true); setStudentsLoading(true);
            const apiUrl = process.env.REACT_APP_API_URL;
            if (!apiUrl) {
                 setLocationError("API URL is not configured.");
                 setLocationLoading(false);
                 setStudentsLoading(false);
                 return;
            }
            // Fetch Locations
            try {
                const locRes = await axios.get(`${apiUrl}/api/locations`);
                setLocations(locRes.data);
                if (locRes.data.length > 0 && !takeLocation) {
                    setTakeLocation(locRes.data[0].name);
                }
            } catch (err) {
                console.error("Failed to fetch locations:", err);
                setLocationError("Failed to load locations list."); // Use specific error state
            } finally {
                setLocationLoading(false);
            }
            // Fetch All Active Students
            try {
                const stuRes = await axios.get(`${apiUrl}/api/students`);
                setAllActiveStudents(stuRes.data);
                setFilteredStudentsForReport(stuRes.data); // Initialize filter list with all students
            } catch (err) {
                 console.error("Failed to fetch all students:", err);
                 // Append error or set a separate student loading error if needed
                 setLocationError(prev => prev ? prev + " Failed to load student list." : "Failed to load student list.");
            } finally {
                 setStudentsLoading(false);
            }
        };
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array means run once on mount

    // --- Load Class for "Take Attendance" ---
    const handleLoadClass = async () => {
        setTakeLoading(true); setTakeError(''); setStudentsForClass([]); setAttendanceStatus({});
        if (!takeLocation && locations.length > 0) {
            setTakeError('Please select a location.');
            setTakeLoading(false);
            return;
        }
        try {
            const apiUrl = process.env.REACT_APP_API_URL;
            if (!apiUrl) throw new Error("API URL not configured.");
            const stuRes = await axios.get(`${apiUrl}/api/students`, { params: { grade: takeGrade, location: takeLocation } });
            setStudentsForClass(stuRes.data);
            const attRes = await axios.get(`${apiUrl}/api/attendance/class`, { params: { date: takeDate, grade: takeGrade, location: takeLocation } });
            const map = attRes.data.reduce((acc, rec) => { if (rec.student?._id) acc[rec.student._id] = rec.status; return acc; }, {});
            setAttendanceStatus(map);
        } catch (err) {
             console.error("Error loading class:", err);
             setTakeError('Error loading class data. ' + (err.response?.data?.message || err.message));
         }
        setTakeLoading(false);
     };

    // --- Mark Attendance ---
    const handleMarkAttendance = async (studentId, status) => {
        // Optimistic UI update
        setAttendanceStatus(prev => ({ ...prev, [studentId]: status }));
        try {
            const apiUrl = process.env.REACT_APP_API_URL;
            if (!apiUrl) throw new Error("API URL not configured.");
            await axios.post(`${apiUrl}/api/attendance/mark`, { studentId, date: takeDate, status, classGrade: takeGrade, location: takeLocation });
        } catch (err) {
             console.error("Error saving attendance:", err);
             setTakeError('Error saving attendance.'); // Show error in take attendance tab
             // Revert UI on error
             setAttendanceStatus(prev => {
                 const currentStatus = { ...prev };
                 // Find previous status or remove entry to revert
                 // This simple version just removes it, showing neither button selected
                 delete currentStatus[studentId];
                 return currentStatus;
             });
         }
    };

    // --- Filter students for the report dropdown ---
    const handleFilterStudentsForReport = () => {
        setReportError(''); // Clear previous report errors
        if (studentsLoading) return; // Wait until students are loaded

        const filtered = allActiveStudents.filter(student => {
            const gradeMatch = reportGradeFilter === 'All' || student.grade === reportGradeFilter;
            const locationMatch = reportLocationFilter === 'All' || student.location === reportLocationFilter;
            // Case-insensitive name filtering
            const nameMatch = !reportNameFilter || student.name.toLowerCase().includes(reportNameFilter.toLowerCase());
            return gradeMatch && locationMatch && nameMatch;
        });
        setFilteredStudentsForReport(filtered);
        setSelectedStudentId(''); // Reset student selection
        setStudentRecords([]);    // Clear the table
    };

    // --- Fetch attendance for selected student (Report Tab) ---
    useEffect(() => {
        const fetchStudentAttendance = async () => {
            // Don't fetch if no student is selected
            if (!selectedStudentId) {
                setStudentRecords([]); // Ensure records are cleared
                return;
            }
            setReportLoading(true); setReportError(''); setStudentRecords([]); // Clear previous records/errors
            try {
                const apiUrl = process.env.REACT_APP_API_URL;
                if (!apiUrl) throw new Error("API URL not configured.");

                // Build query params including dates if they are set
                const params = {};
                if (reportStartDate) params.startDate = reportStartDate;
                if (reportEndDate) params.endDate = reportEndDate;

                const response = await axios.get(`${apiUrl}/api/attendance/student/${selectedStudentId}`, { params });
                setStudentRecords(response.data);
            } catch (err) {
                console.error("Failed to fetch student attendance:", err);
                setReportError('Could not load attendance records for this student.');
            } finally {
                setReportLoading(false);
            }
        };

        // Trigger fetch only if a student ID is present
        if (selectedStudentId) {
             fetchStudentAttendance();
        } else {
             setStudentRecords([]); // Clear records if student is deselected
        }
    // Re-run this effect if the selected student or the date filters change
    }, [selectedStudentId, reportStartDate, reportEndDate]);

    // Helper to format date
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }

    // --- RENDER JSX ---
    return (
        <Container className="mt-4">
            <Tabs defaultActiveKey="takeAttendance" id="attendance-tabs" className="mb-3">

                {/* --- TAB 1: Take Attendance --- */}
                <Tab eventKey="takeAttendance" title="Take Attendance">
                   <Card className="mb-4">
                       <Card.Body>
                            {/* Display location loading error OR take attendance error */}
                            {locationError && <Alert variant="danger">{locationError}</Alert>}
                            {takeError && <Alert variant="danger">{takeError}</Alert>}
                            <Form>
                                <Row>
                                    {/* Grade */}
                                    <Col md={3}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Grade</Form.Label>
                                            <Form.Select value={takeGrade} onChange={(e) => setTakeGrade(e.target.value)}>
                                                <option value="Grade 6">Grade 6</option>
                                                <option value="Grade 7">Grade 7</option>
                                                <option value="Grade 8">Grade 8</option>
                                                <option value="Grade 9">Grade 9</option>
                                                <option value="Grade 10">Grade 10</option>
                                                <option value="Grade 11">Grade 11</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    {/* Location */}
                                    <Col md={3}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Location</Form.Label>
                                            <Form.Select value={takeLocation} onChange={(e) => setTakeLocation(e.target.value)} disabled={locationLoading}>
                                                {locationLoading ? (<option>Loading...</option>) : (
                                                    locations.length > 0 ? (
                                                        locations.map(loc => (<option key={loc._id} value={loc.name}>{loc.name}</option>))
                                                    ) : (<option value="">No locations configured</option>)
                                                )}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    {/* Date */}
                                    <Col md={3}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Date</Form.Label>
                                            <Form.Control type="date" value={takeDate} onChange={(e) => setTakeDate(e.target.value)} />
                                        </Form.Group>
                                    </Col>
                                    {/* Load Button */}
                                    <Col md={3} className="d-flex align-items-end mb-3">
                                        <Button onClick={handleLoadClass} className="w-100" disabled={takeLoading || locationLoading}>
                                            {takeLoading ? <Spinner as="span" size="sm" /> : 'Load Class'}
                                        </Button>
                                    </Col>
                                </Row>
                            </Form>
                       </Card.Body>
                   </Card>
                   {/* Loading Spinner */}
                   {takeLoading && <div className="text-center mb-4"><Spinner animation="border" /></div>}
                   {/* Class List */}
                   {!takeLoading && studentsForClass.length > 0 && (
                       <ListGroup className="mb-4">
                           {studentsForClass.map(student => {
                               const status = attendanceStatus[student._id];
                               return (
                                   <ListGroup.Item key={student._id} className="d-flex justify-content-between align-items-center">
                                       <h5>{student.name} ({student.studentId || 'No ID'})</h5>
                                       <div>
                                           <Button variant={status === 'Present' ? 'success' : 'outline-success'} onClick={() => handleMarkAttendance(student._id, 'Present')} className="me-2">Present</Button>
                                           <Button variant={status === 'Absent' ? 'danger' : 'outline-danger'} onClick={() => handleMarkAttendance(student._id, 'Absent')}>Absent</Button>
                                       </div>
                                   </ListGroup.Item>
                               );
                           })}
                       </ListGroup>
                   )}
                   {/* Info Message */}
                   {!takeLoading && !locationLoading && studentsForClass.length === 0 && (
                       <Alert variant="info" className="mb-4">Select filters and click "Load Class" to mark attendance, or add students on the Students page.</Alert>
                   )}
                </Tab>

                {/* --- TAB 2: Student Report --- */}
                <Tab eventKey="studentReport" title="Student Report">
                     <Card>
                        <Card.Header><Card.Title as="h3" className="mb-0">View Student Attendance</Card.Title></Card.Header>
                        <Card.Body>
                            {/* Display general location or report-specific errors */}
                            {locationError && <Alert variant="danger">{locationError}</Alert>}
                            {reportError && <Alert variant="danger">{reportError}</Alert>}

                            {/* Student Filters */}
                            <Form className="mb-3 border p-3 rounded bg-light">
                                <Row className="mb-2 align-items-end">
                                    <Col md={3} sm={6}>
                                        <Form.Group>
                                            <Form.Label>Grade</Form.Label>
                                            <Form.Select size="sm" value={reportGradeFilter} onChange={(e) => setReportGradeFilter(e.target.value)}>
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
                                    <Col md={3} sm={6}>
                                        <Form.Group>
                                            <Form.Label>Location</Form.Label>
                                            <Form.Select size="sm" value={reportLocationFilter} onChange={(e) => setReportLocationFilter(e.target.value)} disabled={locationLoading}>
                                                <option value="All">All Locations</option>
                                                {locationLoading ? (<option disabled>Loading...</option>) : (
                                                    locations.map(loc => (<option key={loc._id} value={loc.name}>{loc.name}</option>))
                                                )}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={4} sm={8}>
                                        <Form.Group>
                                            <Form.Label>Name Contains</Form.Label>
                                            <Form.Control size="sm" type="text" placeholder="Filter by name..." value={reportNameFilter} onChange={(e) => setReportNameFilter(e.target.value)} />
                                        </Form.Group>
                                    </Col>
                                    <Col md={2} sm={4}>
                                         <Button size="sm" onClick={handleFilterStudentsForReport} className="w-100" disabled={studentsLoading || locationLoading}>Filter Students</Button>
                                    </Col>
                                </Row>
                            </Form>
                            <hr />

                            {/* Student Selection & Date Range */}
                            <Row className="mb-3 align-items-center">
                                <Col md={6}>
                                    <Form.Group controlId="studentSelect">
                                        <Form.Label>Select Student:</Form.Label>
                                        <Form.Select
                                            value={selectedStudentId}
                                            onChange={(e) => setSelectedStudentId(e.target.value)}
                                            disabled={studentsLoading || locationLoading || filteredStudentsForReport.length === 0}
                                        >
                                            <option value="">-- Select from filtered list --</option>
                                            {filteredStudentsForReport.length > 0 && <option disabled>({filteredStudentsForReport.length} found)</option>}
                                            {filteredStudentsForReport.map(student => (
                                                 <option key={student._id} value={student._id}>
                                                     {/* Show ID in dropdown */}
                                                     {student.name} ({student.studentId || 'No ID'})
                                                 </option>
                                             ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                     <Form.Group>
                                        <Form.Label>From Date</Form.Label>
                                        <Form.Control type="date" value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)} max={reportEndDate || undefined} disabled={!selectedStudentId}/>
                                     </Form.Group>
                                </Col>
                                <Col md={3}>
                                     <Form.Group>
                                        <Form.Label>To Date</Form.Label>
                                        <Form.Control type="date" value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)} min={reportStartDate || undefined} disabled={!selectedStudentId}/>
                                     </Form.Group>
                                </Col>
                            </Row>

                            {/* Attendance Table */}
                            {reportLoading && <div className="text-center"><Spinner animation="border"/></div>}
                            {!reportLoading && selectedStudentId && (
                                <Table striped bordered hover responsive size="sm" className="mt-3">
                                    <thead><tr><th>Date</th><th>Status</th><th>Class Grade</th><th>Location</th></tr></thead>
                                    <tbody>
                                        {studentRecords.length > 0 ? (
                                            studentRecords.map(rec => (
                                                <tr key={rec._id}>
                                                    <td>{formatDate(rec.date)}</td>
                                                    <td><Badge bg={rec.status === 'Present' ? 'success' : 'danger'}>{rec.status}</Badge></td>
                                                    <td>{rec.classGrade || '-'}</td>
                                                    <td>{rec.location || '-'}</td>
                                                </tr>
                                            ))
                                        ) : ( <tr><td colSpan="4" className="text-center">No records found for this student/date range.</td></tr> )}
                                    </tbody>
                                </Table>
                            )}
                            {/* Info messages */}
                            {!reportLoading && !selectedStudentId && filteredStudentsForReport.length > 0 && (
                                <Alert variant="info" className="mt-3">Select a student from the dropdown to view their report.</Alert>
                            )}
                            {!reportLoading && !selectedStudentId && filteredStudentsForReport.length === 0 && (
                                <Alert variant="secondary" className="mt-3">Use the filters above and click "Filter Students" to populate the student list.</Alert>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>

            </Tabs>
        </Container>
    );
}

export default AttendancePage;