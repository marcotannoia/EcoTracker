import React from 'react';
import { Link } from 'react-router-dom';
import './Intestazione.css';

// iconi imnimali
const Icons = {
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  User: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  Sun: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>,
  Moon: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
};

function Intestazione({ theme, toggleTheme }) {
  return (
    <header className="main-header-bar">
      <div className="logo-section">
        <Link to="/" className="brand-link">
          <h1 className="brand-name">Ecotrack</h1>
          <span className="brand-sub">PERCORSI & CO₂</span>
        </Link>
      </div>

      <nav className="header-nav">
        <Link to="/cerca" className="nav-link">
          <Icons.Search />
          <span className="nav-text">Cerca</span>
        </Link>
        
        <Link to="/profilo" className="nav-link">
          <Icons.User />
          <span className="nav-text">Profilo</span>
        </Link>
        
        <div className="theme-toggle" onClick={toggleTheme} title="Cambia tema">
          {theme === 'light' ? <Icons.Moon /> : <Icons.Sun />}
          <span className="nav-text">{theme === 'light' ? 'Notte' : 'Giorno'}</span>
        </div>
      </nav>
    </header>
  );
}

export default Intestazione;
