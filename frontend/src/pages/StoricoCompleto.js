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
    <div className="min-h-screen bg-gray-900 text-white p-6 pt-12">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center mb-8 relative">
          <button 
            className="absolute left-0 bg-gray-800 hover:bg-gray-700 p-2 rounded-full text-green-400 transition-colors" 
            onClick={() => naviga('/profilo')}
          >
            ← Indietro
          </button>
          <h1 className="text-3xl font-bold text-green-400 w-full text-center">Storico Completo</h1>
        </header>

        {loading ? (
          <p className="text-center text-gray-400 mt-10">Caricamento storico...</p>
        ) : listaViaggi.length === 0 ? (
          <p className="text-center text-gray-400 mt-10 bg-gray-800 p-6 rounded-xl">Nessun viaggio registrato al momento.</p>
        ) : (
          <div className="space-y-4">
            {listaViaggi.map((viaggio, index) => (
              <div key={index} className="bg-gray-800 p-5 rounded-2xl border border-gray-700 flex justify-between items-center shadow-md">
                <div className="flex items-center gap-4">
                  <div className="bg-gray-700 p-3 rounded-full text-2xl">
                    {getIconaMezzo(viaggio.mezzo)}
                  </div>
                  <div>
                    <p className="font-bold text-lg">{viaggio.destinazione}</p>
                    <p className="text-sm text-gray-400">Da: {viaggio.partenza}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-400">{viaggio.km} km</p>
                  <p className="text-sm text-gray-400">{viaggio.co2} kg CO2</p>
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