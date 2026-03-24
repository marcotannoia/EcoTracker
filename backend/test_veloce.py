import requests

# L'indirizzo del tuo Flask locale
URL_FLASK = "http://127.0.0.1:5000/api/valida-documento"

# Il nome del PDF che hai nella cartella (cambialo con uno vero!)
NOME_FILE = "prova.pdf" 

try:
    with open(NOME_FILE, "rb") as f:
        # Prepariamo il file per l'invio
        files = {'file': (NOME_FILE, f, 'application/pdf')}
        
        print(f"🚀 Spedisco {NOME_FILE} al server Flask...")
        
        # Facciamo la chiamata POST
        response = requests.post(URL_FLASK, files=files)
        
        # Vediamo che succede
        print("\n--- RISPOSTA DEL SERVER ---")
        print(response.json())
        
except FileNotFoundError:
    print(f"❌ Fr, non trovo il file '{NOME_FILE}'! Mettilo nella stessa cartella dello script.")
except Exception as e:
    print(f"❌ Errore: {e}")