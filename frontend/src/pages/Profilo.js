import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 

const URL_SERVER = 'https://api.ecotracker.it';

function PaginaProfilo({ user: utenteLoggato, setUser: setUtenteLoggato }) {
  
  const [statistiche, setStatistiche] = useState({ totaleViaggi: 0, totaleKm: 0, totaleCo2: 0, alberi: 0 });
  const [listaViaggi, setListaViaggi] = useState([]);
  const naviga = useNavigate();

  useEffect(() => {
    if (!utenteLoggato) { naviga('/login'); return; }
    caricaDati();
  }, [utenteLoggato]);

  const caricaDati = async () => { 
    try {
      const risposta = await fetch(`${URL_SERVER}/api/storico`, { credentials: 'include' });
      if (risposta.status === 401) { console.error("Sessione scaduta"); return; }

      const datiJson = await risposta.json(); 
      const viaggiRecuperati = datiJson.viaggi || [];
      setListaViaggi(viaggiRecuperati);

      if (Array.isArray(viaggiRecuperati)) {
        const CO2_AUTO_STANDARD = 0.120;
        const sommaKm = viaggiRecuperati.reduce((totale, viaggio) => totale + parseFloat(viaggio.km || 0), 0);
        const sommaCo2Risparmiata = viaggiRecuperati.reduce((totale, viaggio) => {
          const km = parseFloat(viaggio.km || 0);
          const co2EmessaReale = parseFloat(viaggio.co2 || 0);
          let risparmioViaggio = (km * CO2_AUTO_STANDARD) - co2EmessaReale;
          if (risparmioViaggio < 0) risparmioViaggio = 0;
          return totale + risparmioViaggio;
        }, 0);

        setStatistiche({
          totaleViaggi: viaggiRecuperati.length,
          totaleKm: sommaKm.toFixed(1),
          totaleCo2: sommaCo2Risparmiata.toFixed(1),
          alberi: (sommaCo2Risparmiata / 20).toFixed(1) 
        });
      }
    } catch (errore) { console.error("Impossibile recuperare lo storico:", errore); }
  };

  const eseguiLogout = async () => {
    try {
      await fetch(`${URL_SERVER}/api/logout`, { method: 'POST', credentials: 'include' });
      setUtenteLoggato(null); 
      naviga('/login');
    } catch (errore) { console.error("Errore logout", errore); }
  };

  const ottieniIniziale = () => {
    if (utenteLoggato?.username) return utenteLoggato.username.charAt(0).toUpperCase();
    return '?';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 pt-12">
      <div className="max-w-4xl mx-auto">
        
        {/* Intestazione Profilo */}
        <div className="bg-gray-800 p-8 rounded-3xl shadow-lg border border-gray-700 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-4xl font-bold shadow-lg">
            {ottieniIniziale()}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-extrabold">{utenteLoggato?.username}</h1>
            <p className="text-gray-400">{utenteLoggato?.regione || 'Nessuna regione specificata'}</p>
          </div>
          <button onClick={eseguiLogout} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-bold transition-colors">
            Esci
          </button>
        </div>

        {/* Griglia Statistiche */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 text-center">
            <p className="text-gray-400 text-sm mb-1">Viaggi</p>
            <p className="text-3xl font-bold text-white">{statistiche.totaleViaggi}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 text-center">
            <p className="text-gray-400 text-sm mb-1">Km Percorsi</p>
            <p className="text-3xl font-bold text-white">{statistiche.totaleKm}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-2xl border border-green-500/50 text-center shadow-[0_0_15px_rgba(34,197,94,0.1)]">
            <p className="text-green-400 text-sm mb-1">CO2 Risparmiata</p>
            <p className="text-3xl font-bold text-white">{statistiche.totaleCo2} kg</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 text-center">
            <p className="text-gray-400 text-sm mb-1">Alberi Salvi</p>
            <p className="text-3xl font-bold text-green-400">🌳 {statistiche.alberi}</p>
          </div>
        </div>

        {/* Bottone Storico */}
        <div className="mt-8 text-center">
           <button onClick={() => naviga('/storico')} className="text-green-400 hover:text-green-300 underline font-semibold">
              Vedi storico completo dei viaggi →
           </button>
        </div>

      </div>
    </div>
  );
}

export default PaginaProfilo;