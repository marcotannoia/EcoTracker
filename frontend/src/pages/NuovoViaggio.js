import React, { useState, useEffect } from 'react';
 

const INDIRIZZO_SERVER = 'https://api.ecotracker.it';

// Grafiche per i mezzi di trasporto
const GraficaMezzi = {
  piedi: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13" cy="4" r="2"/><path d="M16 8h-3a2 2 0 0 0-2 2v3l-3 7"/><path d="M11 13l3 7"/><path d="M13 8l4 6"/></svg>,
  bike: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6l-5 5.5"/><path d="M15 6a2 2 0 0 1 2 2v4"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>,
  car: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5.24a2 2 0 00-1.8 1.1l-.8 1.63A6 6 0 002 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>,
  public_bus: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>,
  veicolo_elettrico: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 16h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5.24a2 2 0 00-1.8 1.1l-.8 1.63A6 6 0 002 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/><path d="M10 2v5h4l-2 5"/></svg>
};

function PaginaNuovoViaggio({ user: utente, theme, toggleTheme }) {
  
  // stati default
  const [datiItinerario, setDatiItinerario] = useState({ partenza: '', destinazione: '' });
  const [idMezzoSelezionato, setIdMezzoSelezionato] = useState('car');
  const [listaVeicoliDisponibili, setListaVeicoliDisponibili] = useState([]);
  
  // stati risultati
  const [risultatoCalcolo, setRisultatoCalcolo] = useState(null); 
  const [infoAlberi, setInfoAlberi] = useState(null);

  // Carico i veicoli dal server
  useEffect(() => {
    fetch(`${INDIRIZZO_SERVER}/api/veicoli`)
      .then(risposta => risposta.json())
      .then(dati => setListaVeicoliDisponibili(dati))
      .catch(err => console.error("Impossibile caricare i veicoli", err));
  }, []);

  const avviaCalcoloPercorso = async () => {
    setRisultatoCalcolo(null); // reset
    setInfoAlberi(null);

    try {
      const pacchettoDati = { 
        start: datiItinerario.partenza,
        end: datiItinerario.destinazione,
        mezzo: idMezzoSelezionato
      };

      const rispostaNav = await fetch(`${INDIRIZZO_SERVER}/api/navigazione`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // <--- FONDAMENTALE: Invia il cookie al server
        body: JSON.stringify(pacchettoDati)
      });

      const datiNavigazione = await rispostaNav.json();

      if (datiNavigazione.ok) {
        
        // --- MODIFICA EFFETTUATA: RIMOSSO BLOCCO ALERT ---
        // Ora mostriamo semplicemente i risultati, che l'utente sia loggato o meno.
        setRisultatoCalcolo(datiNavigazione); 
        
        const valoreCO2 = parseFloat(datiNavigazione.emissioni_co2); 
        
        if (!isNaN(valoreCO2) && valoreCO2 > 0) { 
            try {
                const rispostaAlberi = await fetch(`${INDIRIZZO_SERVER}/api/calcolo-alberi`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ co2: valoreCO2 })
                });
                const datiAlberi = await rispostaAlberi.json();
                if (datiAlberi.ok) setInfoAlberi(datiAlberi.messaggio);
            } catch (err) { 
              console.error("Errore API alberi:", err);
            }
        }
      } else { 
        alert(datiNavigazione.errore || "Errore nel calcolo del percorso");
      }
    } catch (e) { 
      console.error(e);
      alert("Errore di connessione al server");
    }
  };

  const aggiornaInput = (campo, valore) => {
    setDatiItinerario(prev => ({ ...prev, [campo]: valore }));
  };

  return (
    <div className={`pagina-nuovo-viaggio ${theme}`}>
      <h1>Calcola il tuo percorso ecologico</h1>
      </div>
  );
}

export default PaginaNuovoViaggio;