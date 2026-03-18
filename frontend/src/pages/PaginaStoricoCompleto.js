import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';


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

    </div>
  );
}

export default PaginaStoricoCompleto;