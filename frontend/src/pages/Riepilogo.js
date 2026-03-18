import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const URL_SERVER = 'https://api.ecotracker.it';

const MAPPA_MEZZI = {
  "piedi": "A piedi", "bike": "Bicicletta", "car": "Auto",
  "public_bus": "Bus", "veicolo_elettrico": "Veicolo Elettrico", "Nessuno": "Nessuno"
};

function PaginaRiepilogo() {
  const { username: nomeUtente } = useParams(); 
  const naviga = useNavigate();
  
  const [datiRiepilogo, setDatiRiepilogo] = useState(null);
  const [inCaricamento, setInCaricamento] = useState(true);
  const [erroreCaricamento, setErroreCaricamento] = useState('');

  useEffect(() => {
    if (nomeUtente) { caricaDatiUtente(); }
  }, [nomeUtente]);

  const caricaDatiUtente = async () => {
    try {
      const risposta = await fetch(`${URL_SERVER}/api/wrapped/${nomeUtente}`, { credentials: 'include' });
      const datiJson = await risposta.json();
      
      if (datiJson.ok && datiJson.dati) { setDatiRiepilogo(datiJson.dati); } 
      else { setErroreCaricamento(datiJson.errore || "Profilo utente non trovato"); }
    } catch (err) { setErroreCaricamento("Impossibile connettersi al server."); } 
    finally { setInCaricamento(false); }
  };

  const stimaRisparmioCo2 = () => {
    if (!datiRiepilogo) return "0.0";
    const km = parseFloat(datiRiepilogo.km_totali || 0);
    const co2Emessa = parseFloat(datiRiepilogo.co2_risparmiata || 0); 
    const co2Auto = km * 0.120;
    const risparmio = co2Auto - co2Emessa;
    return risparmio > 0 ? risparmio.toFixed(1) : "0.0";
  };
  
  if (inCaricamento) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-green-400 text-2xl font-bold animate-pulse">Analisi dati in corso...</div>;
  
  if (erroreCaricamento) return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
      <p className="text-red-400 text-xl mb-4">{erroreCaricamento}</p>
      <button onClick={() => naviga(-1)} className="bg-gray-800 px-6 py-2 rounded-lg hover:bg-gray-700">← Torna Indietro</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 pt-12">
      <div className="max-w-2xl mx-auto relative">
        <button onClick={() => naviga(-1)} className="absolute top-0 left-0 text-gray-400 hover:text-white mt-2">← Indietro</button>
        
        <header className="text-center mt-12 mb-10">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 mb-2">
            EcoWrapped
          </h1>
          <p className="text-xl text-gray-300">L'anno ecologico di <span className="font-bold text-white">{nomeUtente}</span></p>
        </header>

        <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 shadow-2xl space-y-8">
          
          <div className="text-center">
            <p className="text-gray-400 uppercase tracking-widest text-sm font-bold mb-2">Mezzo Preferito</p>
            <p className="text-4xl font-bold text-white bg-gray-900 inline-block px-8 py-4 rounded-2xl border border-gray-700 shadow-inner">
              {MAPPA_MEZZI[datiRiepilogo.mezzo_preferito] || "Nessuno"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900 p-6 rounded-2xl text-center border border-gray-700">
              <p className="text-gray-400 text-sm mb-1">Distanza Totale</p>
              <p className="text-2xl font-bold">{parseFloat(datiRiepilogo.km_totali).toFixed(1)} km</p>
            </div>
            <div className="bg-green-500/10 p-6 rounded-2xl text-center border border-green-500/30">
              <p className="text-green-400 text-sm mb-1">CO2 Risparmiata</p>
              <p className="text-2xl font-bold text-green-400">{stimaRisparmioCo2()} kg</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default PaginaRiepilogo;