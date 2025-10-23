import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom'; // We use Link for navigation

function NavigationBar() {
  return (
    // 'bg-dark' and 'variant-dark' give it a dark theme
    // 'expand-lg' makes it collapse into a "hamburger" menu on medium/small screens
    <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
      <Container>
        <Navbar.Brand as={Link} to="/">Manager</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {/* 'as={Link}' tells react-bootstrap to use React Router's Link */}
            <Nav.Link as={Link} to="/">Dashboard</Nav.Link>
            <Nav.Link as={Link} to="/students">Students</Nav.Link>
            <Nav.Link as={Link} to="/payments">Payments</Nav.Link>
            <Nav.Link as={Link} to="/attendance">Attendance</Nav.Link>
            <Nav.Link as={Link} to="/finance-report">Finance Report</Nav.Link>
            <Nav.Link as={Link} to="/settings">Settings</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavigationBar;