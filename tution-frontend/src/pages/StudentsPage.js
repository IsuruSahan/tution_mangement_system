import React, { useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import AddStudent from '../components/AddStudent';
import StudentList from '../components/StudentList';
import { useAuth } from '../context/AuthContext';

function StudentsPage() {
    const [refreshKey, setRefreshKey] = useState(0);
    const { teacher } = useAuth(); // Get teacher info to personalize the page

    // Increment the key to force StudentList to re-fetch data
    const handleListRefresh = () => {
        setRefreshKey(oldKey => oldKey + 1);
    };

    return (
        <Container className="mt-4">
            <Row className="mb-4">
                <Col>
                    <h2 className="border-bottom pb-2">Student Management</h2>
                    <p className="text-muted">
                        Managing students for: <strong>{teacher?.instituteName}</strong>
                    </p>
                </Col>
            </Row>

            {/* Pass the refresh function to AddStudent so when a 
              new student is saved, the list below updates automatically.
            */}
            <AddStudent onStudentAdded={handleListRefresh} />

            <hr className="my-5" />

            {/* StudentList now uses the refreshKey to stay in sync. 
              Because of our Axios interceptor in AuthContext, this list 
              will only ever show students belonging to this teacher.
            */}
            <StudentList 
                refreshKey={refreshKey} 
                onListRefresh={handleListRefresh} 
            />
        </Container>
    );
}

export default StudentsPage;