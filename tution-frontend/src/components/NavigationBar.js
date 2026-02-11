import React, { useState } from 'react';
import { Navbar, Nav, Container, Button, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom'; 
import { FaQrcode, FaUserCircle, FaSignOutAlt, FaUserPlus, FaMapMarkerAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext'; 

function NavigationBar() {
  const [expanded, setExpanded] = useState(false);
  const { teacher, logout } = useAuth(); 
  const navigate = useNavigate();

  const handleLogout = () => {
    setExpanded(false);
    logout();
    navigate('/login');
  };

  const closeMenu = () => setExpanded(false);

  return (
    <Navbar 
      bg="dark" 
      variant="dark" 
      expand="lg" 
      sticky="top"
      expanded={expanded}
      className="shadow-sm"
    >
      <Container>
        <Navbar.Brand as={Link} to="/" onClick={closeMenu} className="fw-bold">
          TMS {teacher && <small className="text-muted ms-2 fw-normal">| {teacher.instituteName}</small>}
        </Navbar.Brand>
        
        <Navbar.Toggle 
          aria-controls="basic-navbar-nav" 
          onClick={() => setExpanded(!expanded)} 
        />
        
        <Navbar.Collapse id="basic-navbar-nav">
          {teacher ? (
            <>
              <Nav className="me-auto">
                <Nav.Link as={Link} to="/" onClick={closeMenu}>Dashboard</Nav.Link>
                <Nav.Link as={Link} to="/students" onClick={closeMenu}>Students</Nav.Link>
                <Nav.Link as={Link} to="/payments" onClick={closeMenu}>Payments</Nav.Link>
                <Nav.Link as={Link} to="/attendance" onClick={closeMenu}>Attendance</Nav.Link>
                <Nav.Link as={Link} to="/finance-report" onClick={closeMenu}>Finance Report</Nav.Link>
                <Nav.Link as={Link} to="/settings" onClick={closeMenu}>Settings</Nav.Link>
              </Nav>

              <Nav className="ms-auto align-items-center">
                <Nav.Link as={Link} to="/scan" onClick={closeMenu} className="me-lg-3">
                  <Button variant="success" className="fw-bold">
                    <FaQrcode className="me-2" /> Scan & Check-in
                  </Button>
                </Nav.Link>

                {/* UPDATED: Dropdown title uses firstName */}
                <NavDropdown 
                  title={<span><FaUserCircle className="me-1" /> {teacher.firstName}</span>} 
                  id="collasible-nav-dropdown"
                  align="end"
                >
                  <div className="px-3 py-2 border-bottom bg-light">
                    <div className="fw-bold small">{teacher.firstName} {teacher.lastName}</div>
                    <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                      <FaMapMarkerAlt className="me-1" /> {teacher.location}
                    </div>
                  </div>
                  <NavDropdown.Item onClick={handleLogout} className="text-danger mt-1">
                    <FaSignOutAlt className="me-2" /> Logout
                  </NavDropdown.Item>
                </NavDropdown>
              </Nav>
            </>
          ) : (
            <Nav className="ms-auto align-items-center">
              <Nav.Link as={Link} to="/login" onClick={closeMenu} className="me-lg-3">
                Login
              </Nav.Link>
              <Nav.Link as={Link} to="/register" onClick={closeMenu}>
                <Button variant="outline-light" size="sm" className="fw-bold px-3">
                  <FaUserPlus className="me-2" /> Get Started
                </Button>
              </Nav.Link>
            </Nav>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavigationBar;