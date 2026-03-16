import React from 'react';
import { Link, useLocation } from 'react-router-dom'; 
import './Navbar.css';

function Navbar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? "active" : ""; 

  return (
    <nav className="nav-bar">
      <Link to="/" className={`nav-item ${isActive('/')}`}>
        <span className="nav-icon">🏠</span>
        <span className="nav-label">Calcola</span>
      </Link>

      <Link to="/cerca" className={`nav-item ${isActive('/cerca')}`}>
        <span className="nav-icon">🔍</span>
        <span className="nav-label">Cerca</span>
      </Link>

      <Link to="/profilo" className={`nav-item ${isActive('/profilo')}`}>
        <span className="nav-icon">👤</span>
        <span className="nav-label">Profilo</span>
      </Link>
    </nav>
  );
}

export default Navbar;
// TUTTO PRESO DA REACT