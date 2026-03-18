import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const URL_BASE_API = 'https://api.ecotracker.it';

function PaginaRicerca({ user: utenteLoggato }) {
  const [listaUtenti, setListaUtenti] = useState([]);
  const [classifica, setClassifica] = useState([]); 
  const [testoRicerca, setTestoRicerca] = useState('');

  const naviga = useNavigate();

  useEffect(() => { caricaDati(); }, []);

  const caricaDati = async () => {
    try {
      const rispUtenti = await fetch(`${URL_BASE_API}/api/utenti`, { credentials: 'include' });
      const datiUtenti = await rispUtenti.json();
      if (datiUtenti.ok) setListaUtenti(datiUtenti.utenti || []);

      const rispClassifica = await fetch(`${URL_BASE_API}/api/classifica`, { credentials: 'include' });
      const datiClassifica = await rispClassifica.json();
      if (datiClassifica.ok) setClassifica(datiClassifica.classifica || []);
    } catch (errore) { console.error("Errore caricamento ricerca:", errore); } 
  };

  const utentiConsigliati = listaUtenti.filter(u => 
    utenteLoggato && u.username !== utenteLoggato.username && utenteLoggato.regione && u.regione && 
    u.regione.toLowerCase() === utenteLoggato.regione.toLowerCase()
  );

  const risultatiFiltrati = testoRicerca 
    ? listaUtenti.filter(u => 
        (utenteLoggato ? u.username !== utenteLoggato.username : true) &&
        u.username.toLowerCase().includes(testoRicerca.toLowerCase())
      )
    : [];

  const apriProfilo = (username) => naviga(`/wrapped/${username}`);

  const assegnaMedaglia = (posizione) => {
    if (posizione === 0) return "🥇";
    if (posizione === 1) return "🥈";
    if (posizione === 2) return "🥉";
    return `#${posizione + 1}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 pt-12">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <header className="text-center">
          <h1 className="text-4xl font-extrabold text-green-400">Community</h1>
          <p className="text-gray-400 mt-2">Trova amici e scala la classifica</p>
        </header>

        {/* Barra di ricerca */}
        <div className="relative">
          <input 
            type="text" 
            placeholder="Cerca un utente..." 
            className="w-full bg-gray-800 text-white px-6 py-4 rounded-full border border-gray-700 focus:border-green-500 outline-none shadow-lg text-lg"
            value={testoRicerca}
            onChange={(e) => setTestoRicerca(e.target.value)}
          />
        </div>

        {/* Risultati Ricerca */}
        {testoRicerca && (
          <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700">
            <h2 className="text-xl font-bold text-gray-300 mb-4 px-2">Risultati:</h2>
            {risultatiFiltrati.length > 0 ? risultatiFiltrati.map((u, i) => (
              <div key={i} onClick={() => apriProfilo(u.username)} className="p-3 hover:bg-gray-700 rounded-lg cursor-pointer flex justify-between items-center transition-colors">
                <span className="font-bold">{u.username}</span>
                <span className="text-sm text-gray-400">{u.regione}</span>
              </div>
            )) : <p className="text-gray-500 px-2">Nessun utente trovato.</p>}
          </div>
        )}

        {/* Griglia Layout: Consigliati + Classifica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Utenti Consigliati */}
          <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700 shadow-lg">
            <h2 className="text-2xl font-bold text-green-400 mb-4">Vicino a te 📍</h2>
            <div className="space-y-2">
              {utentiConsigliati.length > 0 ? utentiConsigliati.map((u, i) => (
                <div key={i} onClick={() => apriProfilo(u.username)} className="p-3 bg-gray-900 hover:bg-gray-700 rounded-xl cursor-pointer flex items-center gap-3 transition-colors border border-gray-800">
                  <div className="w-10 h-10 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center font-bold">
                    {u.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-bold">{u.username}</span>
                </div>
              )) : <p className="text-gray-500">Nessun utente nella tua regione.</p>}
            </div>
          </div>

          {/* Classifica */}
          <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700 shadow-lg">
            <h2 className="text-2xl font-bold text-green-400 mb-4">Top Eroi CO2 🌍</h2>
            <div className="space-y-3">
              {classifica.length > 0 ? classifica.map((utente, indice) => (
                <div key={indice} onClick={() => apriProfilo(utente.username)} className="p-3 bg-gray-900 hover:bg-gray-700 rounded-xl cursor-pointer flex justify-between items-center transition-colors border border-gray-800">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl w-8 text-center">{assegnaMedaglia(indice)}</span>
                    <span className="font-bold text-lg">{utente.username}</span>
                  </div>
                  <span className="text-green-400 font-bold">{parseFloat(utente.co2_risparmiata || 0).toFixed(1)} kg</span>
                </div>
              )) : <p className="text-gray-500">Classifica vuota.</p>}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default PaginaRicerca;