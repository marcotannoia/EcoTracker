import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PaginaStoricoCompleto.css'; 

const URL_SERVER = 'https://api.ecotracker.it';

function PaginaStoricoCompleto() {
  const [listaViaggi, setListaViaggi] = useState([]);
  const [loading, setLoading] = useState(true);
  const naviga = useNavigate();

  useEffect(() => {
    caricaTuttiViaggi();
  }, []);

  const caricaTuttiViaggi = async () => {
    try {
      const risposta = await fetch(`${URL_SERVER}/api/storico`, { credentials: 'include' });
      if (risposta.status === 401) {
        naviga('/login');
        return;
      }
      const datiJson = await risposta.json();
      setListaViaggi(datiJson.viaggi || []);
    } catch (errore) {
      console.error("Errore:", errore);
    } finally {
      setLoading(false);
    }
  };

  const getIconaMezzo = (mezzo) => {
    switch(mezzo) {
      case 'veicolo_elettrico': return '⚡';
      case 'piedi': return '👣';
      case 'bike': return '🚲';
      case 'public_bus': return '🚌';
      default: return '🚗';
    }
  };

  return (
    <div className="storico-page">
      <header className="storico-header fade-in">
        <button className="back-btn-absolute" onClick={() => naviga('/profilo')}>
          ←
        </button>
        <h1 className="brand-title-small">Storico Viaggi</h1>
      </header>

      <div className="glass-container fade-in">
        {loading ? (
          <div style={{textAlign:'center', padding:'40px', color:'var(--text-secondary)'}}>Caricamento...</div>
        ) : listaViaggi.length === 0 ? (
          <div className="empty-box">
            <span style={{fontSize:'3rem'}}>🌱</span>
            <h3>Nessun viaggio ancora salvato.</h3>
            <button className="empty-btn" onClick={() => naviga('/')}>Inizia ora</button>
          </div>
        ) : (
          <div className="scrollable-list">
            {listaViaggi.map((viaggio, index) => (
              <div key={index} className="trip-item">
                <div className="trip-left">
                  <div className="icon-box">
                    {getIconaMezzo(viaggio.mezzo)}
                  </div>
                  <div className="trip-details">
                    <span className="route-text">
                       {viaggio.partenza?.split(',')[0]} → {viaggio.arrivo?.split(',')[0]}
                    </span>
                    <span className="date-text">
                      {viaggio.data} • {viaggio.mezzo}
                    </span>
                  </div>
                </div>

                <div className="trip-right">
                  <span className="km-text">{parseFloat(viaggio.km).toFixed(1)} km</span>
                  <span className="co2-badge">
                     -{parseFloat(viaggio.co2 || 0).toFixed(1)} kg CO₂
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PaginaStoricoCompleto;