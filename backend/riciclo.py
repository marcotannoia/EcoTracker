# backend/riciclo.py
import os
from dotenv import load_dotenv  # <-- Import aggiunto
import google.generativeai as genai
from flask import Blueprint, request, jsonify

# Carica le variabili dal file .env locale
load_dotenv()

# Configuro il Blueprint per agganciarlo ad app.py
riciclo_bp = Blueprint('riciclo', __name__)

# Prende la chiave in modo ipersicuro
CHIAVE_GEMINI = os.getenv("GEMINI_API_KEY")

if not CHIAVE_GEMINI:
    print("ATTENZIONE: Chiave Gemini non trovata nel file .env!")

genai.configure(api_key=CHIAVE_GEMINI)

# Istruzioni di base per blindare il comportamento dell'AI
ISTRUZIONI_SISTEMA = """
Sei l'Assistente AI Ufficiale di EcoTracker, un esperto rigoroso in smaltimento di rifiuti elettronici (RAEE) e sostenibilità.
Il tuo unico scopo è aiutare l'utente a capire se un dispositivo può essere riutilizzato o come va smaltito correttamente.
Regole:
1. Sii breve, schematico e pratico. Usa elenchi puntati.
2. Specifica sempre che i dispositivi elettronici NON vanno mai buttati nell'indifferenziata.
3. Se l'utente ti chiede cose non inerenti all'ecologia o ai dispositivi (es. ricette, programmazione, storia), rifiutati cortesemente di rispondere e riporta il focus sui RAEE.
"""

try:
    modello_ai = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction=ISTRUZIONI_SISTEMA
    )
except Exception as e:
    print(f"Errore inizializzazione Gemini: {e}")

@riciclo_bp.route('/api/chat-riciclo', methods=['POST'])
def chat_assistente_raee():
    dati = request.get_json()
    
    if not dati or 'messaggio' not in dati:
        return jsonify({"ok": False, "errore": "Nessun messaggio inviato"}), 400
        
    messaggio_utente = dati['messaggio']

    try:
        risposta_ai = modello_ai.generate_content(messaggio_utente)
        
        return jsonify({
            "ok": True,
            "risposta": risposta_ai.text
        })
    except Exception as e:
        print(f"Errore API Gemini: {e}")
        return jsonify({
            "ok": False, 
            "errore": "I server dell'AI sono momentaneamente irraggiungibili."
        }), 500