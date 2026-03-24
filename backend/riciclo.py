import os
from dotenv import load_dotenv # qui ho le key
import google.generativeai as genai
from flask import Blueprint, request, jsonify
import base64
import requests


load_dotenv()


riciclo_bp = Blueprint('riciclo', __name__)
CHIAVE_GEMINI = os.getenv("GEMINI_API_KEY")

genai.configure(api_key=CHIAVE_GEMINI)

ISTRUZIONI = """
Sei l'Assistente AI Ufficiale di EcoTracker, un software che deve sensibilizzar esulle scelte ambientali, in seguito alla richiesta dell'utente tu devi inserire 
le possibilita principali di come riciclarlo o, qualora non volessero riciclarli o siano oggetti non riciclabili, spiegare perché e suggerire alternative sostenibili.
1. Sii breve, schematico e pratico. Usa elenchi puntati.
2. Specifica sempre che i dispositivi elettronici NON vanno mai buttati nell'indifferenziata.
3. Se l'utente ti chiede cose non inerenti all'ecologia o ai dispositivi (es. ricette, programmazione, storia), rifiutati cortesemente di rispondere e riporta il focus sui RAEE.
"""

try:
    modello_ai = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction=ISTRUZIONI
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

@riciclo_bp.route('/api/valida-documento', methods=['POST'])
def valida_documento_nft():
    """
    Questa rotta riceve il file dal "mondo esterno" e lo lancia ad AWS.
    """
    # 1. Recupero del file dalla richiesta "multipart/form-data"
    if 'file' not in request.files:
        return jsonify({"ok": False, "errore": "Devi caricare un file PDF, Bro"}), 400
        
    file_pdf = request.files['file']
    
    # 2. L'URL che ti ha dato SAM Deploy (mettilo nel tuo file .env per sicurezza!)
    # Esempio: "https://a1b2c3d4.execute-api.eu-south-1.amazonaws.com/Prod/validate/"
    URL_AWS = os.getenv("AWS_LAMBDA_URL") 

    try:
        # 3. Leggiamo il PDF e lo convertiamo in Base64
        pdf_bytes = file_pdf.read()
        pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')

        # 4. Prepariamo il payload per la Lambda
        payload = {
            "pdf_data": pdf_base64,
            "file_name": file_pdf.filename
        }

        # 5. Chiamata sincrona ad AWS
        print(f"DEBUG: Invio {file_pdf.filename} ad AWS...")
        risposta_aws = requests.post(URL_AWS, json=payload, timeout=60)
        
        if risposta_aws.status_code == 200:
            dati = risposta_aws.json()
            return jsonify({
                "ok": True,
                "badge_sbloccabile": dati.get("badge_sbloccabile", False),
                "analisi": dati.get("analisi")
            })
        else:
            return jsonify({"ok": False, "errore": "AWS ha risposto con errore"}), 500

    except Exception as e:
        print(f"ERRORE: {str(e)}")
        return jsonify({"ok": False, "errore": str(e)}), 500