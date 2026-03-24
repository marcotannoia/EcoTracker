import requests

URL_FLASK = "http://127.0.0.1:5000/api/valida-documento"
# Metti qui il nome esatto della tua foto o scansione
FILE_NAME = "ricevuta.pdf" 
DATI_UTENTE = {"user_id": "marco_tester_2026"}

def esegui_test():
    try:
        with open(FILE_NAME, "rb") as f:
            files = {"file": f}
            print(f"🚀 Invio della RICEVUTA ({FILE_NAME}) al server...")
            
            # Invio file + ID utente
            response = requests.post(URL_FLASK, files=files, data=DATI_UTENTE)
            dati = response.json()
            
            print(f"\n--- RISPOSTA DEL SERVER (Status: {response.status_code}) ---")
            
            # Stampiamo la risposta umana in modo pulito!
            if dati.get('ok'):
                print(f"🤖 EcoTracker AI dice:\n>> {dati['analisi'].get('spiegazione_umana', 'Nessuna spiegazione fornita.')}\n")
                print(f"🏆 Badge Sbloccato: {'SÌ! 🎉' if dati.get('badge_sbloccabile') else 'No ❌'}")
            else:
                print(f"❌ Errore del sistema: {dati.get('errore')}")
                
            # Se vuoi vedere comunque i dati grezzi:
            # print("\n[Dati Tecnici JSON]:", dati)
            
    except Exception as e:
        print(f"❌ Errore: {e}")

if __name__ == "__main__":
    esegui_test()