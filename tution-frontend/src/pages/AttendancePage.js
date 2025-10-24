import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Form, Button, Card, ListGroup, Spinner, Alert, Tabs, Tab, Table, Badge } from 'react-bootstrap';

const getISODate = (date) => date.toISOString().split('T')[0];

function AttendancePage() {
    // --- State: Take Attendance ---
    const [takeGrade, setTakeGrade] = useState('Grade 6');
    const [takeLocation, setTakeLocation] = useState('');
    const [takeDate, setTakeDate] = useState(getISODate(new Date()));
    const [studentsForClass, setStudentsForClass] = useState([]);
    const [attendanceStatus, setAttendanceStatus] = useState({});
    const [takeLoading, setTakeLoading] = useState(false);
    const [takeError, setTakeError] = useState('');

    // --- State: Shared ---
    const [locations, setLocations] = useState([]);
    const [locationLoading, setLocationLoading] = useState(true);
    const [locationError, setLocationError] = useState('');
    const [allActiveStudents, setAllActiveStudents] = useState([]);
    const [studentsLoading, setStudentsLoading] = useState(true);

    // --- State: Student Report ---
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
    // --- NEW STATE: Track if filter button was clicked ---
    const [filterApplied, setFilterApplied] = useState(false);

    // --- Initial Data Fetch ---
    useEffect(() => { /* ... unchanged ... */
        const fetchData = async () => { setLocationLoading(true); setStudentsLoading(true); const apiUrl = process.env.REACT_APP_API_URL; if (!apiUrl) { setLocationError("API URL missing."); setLocationLoading(false); setStudentsLoading(false); return; } try { const locRes = await axios.get(`${apiUrl}/api/locations`); setLocations(locRes.data); if (locRes.data.length > 0 && !takeLocation) { setTakeLocation(locRes.data[0].name); } } catch (err) { console.error("Failed locations:", err); setLocationError("Failed locations."); } finally { setLocationLoading(false); } try { const stuRes = await axios.get(`${apiUrl}/api/students`); setAllActiveStudents(stuRes.data); setFilteredStudentsForReport(stuRes.data); } catch (err) { console.error("Failed students:", err); setLocationError(prev => prev + " Failed students."); } finally { setStudentsLoading(false); } }; fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- Handlers ---
    const handleLoadClass = async () => { /* ... unchanged ... */
        setTakeLoading(true); setTakeError(''); setStudentsForClass([]); setAttendanceStatus({}); if (!takeLocation && locations.length > 0) { setTakeError('Select location.'); setTakeLoading(false); return; } try { const apiUrl = process.env.REACT_APP_API_URL; const stuRes = await axios.get(`${apiUrl}/api/students`, { params: { grade: takeGrade, location: takeLocation } }); setStudentsForClass(stuRes.data); const attRes = await axios.get(`${apiUrl}/api/attendance/class`, { params: { date: takeDate, grade: takeGrade, location: takeLocation } }); const map = attRes.data.reduce((acc, rec) => { if (rec.student?._id) acc[rec.student._id] = rec.status; return acc; }, {}); setAttendanceStatus(map); } catch (err) { setTakeError('Error loading class. ' + (err.response?.data?.message || err.message)); } setTakeLoading(false);
     };
    const handleMarkAttendance = async (studentId, status) => { /* ... unchanged ... */
        setAttendanceStatus(prev => ({ ...prev, [studentId]: status })); try { const apiUrl = process.env.REACT_APP_API_URL; await axios.post(`${apiUrl}/api/attendance/mark`, { studentId, date: takeDate, status, classGrade: takeGrade, location: takeLocation }); } catch (err) { setTakeError('Error saving.'); setAttendanceStatus(prev => { const curr = {...prev}; delete curr[studentId]; return curr; }); }
    };

    // --- Filter students for the report dropdown ---
    // *** MODIFIED ***
    const handleFilterStudentsForReport = () => {
        setReportError('');
        if (studentsLoading) return;
        const filtered = allActiveStudents.filter(student => {
            const gradeMatch = reportGradeFilter === 'All' || student.grade === reportGradeFilter;
            const locationMatch = reportLocationFilter === 'All' || student.location === reportLocationFilter;
            const nameMatch = !reportNameFilter || student.name.toLowerCase().includes(reportNameFilter.toLowerCase());
            return gradeMatch && locationMatch && nameMatch;
        });
        setFilteredStudentsForReport(filtered);
        setSelectedStudentId('');
        setStudentRecords([]);
        setFilterApplied(true); // <--- SET FILTER APPLIED FLAG
    };

    // --- Fetch attendance for selected student (Report Tab) ---
    useEffect(() => { /* ... unchanged ... */
        const fetchStudentAttendance = async () => { if (!selectedStudentId) { setStudentRecords([]); return; } setReportLoading(true); setReportError(''); setStudentRecords([]); try { const apiUrl = process.env.REACT_APP_API_URL; const params = {}; if (reportStartDate) params.startDate = reportStartDate; if (reportEndDate) params.endDate = reportEndDate; const res = await axios.get(`${apiUrl}/api/attendance/student/${selectedStudentId}`, { params }); setStudentRecords(res.data); } catch (err) { console.error("Failed attendance:", err); setReportError('Could not load records.'); } finally { setReportLoading(false); } }; if (selectedStudentId) { fetchStudentAttendance(); } else { setStudentRecords([]); }
    }, [selectedStudentId, reportStartDate, reportEndDate]);

    // --- Helper function to reset filterApplied state when filters change ---
    const handleReportFilterChange = (setter) => (e) => {
        setter(e.target.value);
        setFilterApplied(false); // Reset validation state on filter change
        setSelectedStudentId(''); // Also reset student selection
        setStudentRecords([]);
    };

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

    return (
        <Container className="mt-4">
            <Tabs defaultActiveKey="takeAttendance" id="attendance-tabs" className="mb-3">

                {/* --- TAB 1: Take Attendance --- */}
                <Tab eventKey="takeAttendance" title="Take Attendance">
                   {/* ... UI Unchanged ... */}
                   <Card className="mb-4"> <Card.Body> {locationError && <Alert variant="danger">{locationError}</Alert>} {takeError && <Alert variant="danger">{takeError}</Alert>} <Form> <Row> <Col md={3}> <Form.Group className="mb-3"> <Form.Label>Grade</Form.Label> <Form.Select value={takeGrade} onChange={(e) => setTakeGrade(e.target.value)}> <option value="Grade 6">Grade 6</option> <option value="Grade 7">Grade 7</option> <option value="Grade 8">Grade 8</option> <option value="Grade 9">Grade 9</option> <option value="Grade 10">Grade 10</option> <option value="Grade 11">Grade 11</option> </ Form.Select> </Form.Group> </Col> <Col md={3}> <Form.Group className="mb-3"> <Form.Label>Location</Form.Label> <Form.Select value={takeLocation} onChange={(e) => setTakeLocation(e.target.value)} disabled={locationLoading}> {locationLoading ? (<option>...</option>) : ( locations.length > 0 ? ( locations.map(loc => (<option key={loc._id} value={loc.name}>{loc.name}</option>)) ) : (<option value="">No locations</option>) )} </Form.Select> </Form.Group> </Col> <Col md={3}> <Form.Group className="mb-3"> <Form.Label>Date</Form.Label> <Form.Control type="date" value={takeDate} onChange={(e) => setTakeDate(e.target.value)} /> </Form.Group> </Col> <Col md={3} className="d-flex align-items-end mb-3"> <Button onClick={handleLoadClass} className="w-100" disabled={takeLoading || locationLoading}> {takeLoading ? <Spinner size="sm" /> : 'Load Class'} </Button> </Col> </Row> </Form> </Card.Body> </Card>
                   {takeLoading && <div className="text-center mb-4"><Spinner animation="border" /></div>} {!takeLoading && studentsForClass.length > 0 && ( <ListGroup className="mb-4"> {studentsForClass.map(s => { const st = attendanceStatus[s._id]; return (<ListGroup.Item key={s._id} className="d-flex justify-content-between align-items-center"><h5>{s.name} ({s.studentId || 'N/A'})</h5><div><Button variant={st==='Present'?'success':'outline-success'} onClick={()=>handleMarkAttendance(s._id,'Present')} className="me-2">Present</Button><Button variant={st==='Absent'?'danger':'outline-danger'} onClick={()=>handleMarkAttendance(s._id,'Absent')}>Absent</Button></div></ListGroup.Item>); })} </ListGroup> )} {!takeLoading && !locationLoading && studentsForClass.length === 0 && ( <Alert variant="info" className="mb-4">Select filters and click "Load Class".</Alert> )}
                </Tab>

                {/* --- TAB 2: Student Report --- */}
                <Tab eventKey="studentReport" title="Student Report">
                     <Card>
                        <Card.Header><Card.Title as="h3" className="mb-0">View Student Attendance</Card.Title></Card.Header>
                        <Card.Body>
                            {locationError && <Alert variant="danger">{locationError}</Alert>}
                            {reportError && <Alert variant="danger">{reportError}</Alert>}

                            {/* Student Filters */}
                            <Form className="mb-3 border p-3 rounded bg-light">
                                <Row className="mb-2 align-items-end">
                                    <Col md={3} sm={6}>
                                        <Form.Group> <Form.Label>Grade</Form.Label>
                                            {/* --- MODIFIED onChange --- */}
                                            <Form.Select size="sm" value={reportGradeFilter} onChange={handleReportFilterChange(setReportGradeFilter)}>
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
                                        <Form.Group> <Form.Label>Location</Form.Label>
                                            {/* --- MODIFIED onChange --- */}
                                            <Form.Select size="sm" value={reportLocationFilter} onChange={handleReportFilterChange(setReportLocationFilter)} disabled={locationLoading}>
                                                <option value="All">All Locations</option>
                                                {locationLoading ? (<option>...</option>) : ( locations.map(loc => (<option key={loc._id} value={loc.name}>{loc.name}</option>)) )}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={4} sm={8}>
                                        <Form.Group> <Form.Label>Name Contains (Optional)</Form.Label>
                                            {/* --- MODIFIED onChange --- */}
                                            <Form.Control size="sm" type="text" placeholder="Filter by name..." value={reportNameFilter} onChange={handleReportFilterChange(setReportNameFilter)} />
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
                                            // --- ADDED VALIDATION PROPS ---
                                            isValid={filterApplied && filteredStudentsForReport.length > 0}
                                            isInvalid={filterApplied && filteredStudentsForReport.length === 0}
                                        >
                                            <option value="">-- Select from filtered list --</option>
                                            {filteredStudentsForReport.length > 0 && <option disabled>({filteredStudentsForReport.length} found)</option>}
                                            {filteredStudentsForReport.map(student => (
                                                 <option key={student._id} value={student._id}>
                                                     {student.name} ({student.studentId || 'No ID'})
                                                 </option>
                                             ))}
                                        </Form.Select>
                                        {/* Optional: Add feedback messages */}
                                        <Form.Control.Feedback type="valid">Student(s) found.</Form.Control.Feedback>
                                        <Form.Control.Feedback type="invalid">No students match filters.</Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                     <Form.Group> <Form.Label>From Date</Form.Label> <Form.Control type="date" value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)} max={reportEndDate || undefined} disabled={!selectedStudentId}/> </Form.Group>
                                </Col>
                                <Col md={3}>
                                     <Form.Group> <Form.Label>To Date</Form.Label> <Form.Control type="date" value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)} min={reportStartDate || undefined} disabled={!selectedStudentId}/> </Form.Group>
                                </Col>
                            </Row>

                            {/* Attendance Table */}
                            {reportLoading && <div className="text-center"><Spinner animation="border"/></div>}
                            {!reportLoading && selectedStudentId && ( /* ... Table remains the same ... */ <Table striped bordered hover responsive size="sm" className="mt-3"> <thead><tr><th>Date</th><th>Status</th><th>Class Grade</th><th>Location</th></tr></thead> <tbody> {studentRecords.length > 0 ? ( studentRecords.map(rec => ( <tr key={rec._id}> <td>{formatDate(rec.date)}</td> <td><Badge bg={rec.status === 'Present' ? 'success' : 'danger'}>{rec.status}</Badge></td> <td>{rec.classGrade || '-'}</td> <td>{rec.location || '-'}</td> </tr> )) ) : ( <tr><td colSpan="4" className="text-center">No records found.</td></tr> )} </tbody> </Table> )}
                            {/* Info messages */}
                            {!reportLoading && !selectedStudentId && filterApplied && filteredStudentsForReport.length > 0 && ( <Alert variant="info" className="mt-3">Select a student.</Alert> )}
                            {!reportLoading && !selectedStudentId && filterApplied && filteredStudentsForReport.length === 0 && ( <Alert variant="danger" className="mt-3">No students found matching the selected filters.</Alert> )}
                             {/* Initial message before filtering */}
                            {!reportLoading && !selectedStudentId && !filterApplied && ( <Alert variant="secondary" className="mt-3">Use filters and click "Filter Students".</Alert> )}
                        </Card.Body>
                    </Card>
                </Tab>

            </Tabs>
        </Container>
    );
}

export default AttendancePage;