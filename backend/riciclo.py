import os
import requests
import base64
import json # Aggiunto l'import qui in alto, è più pulito
from flask import Blueprint, request, jsonify
from pypdf import PdfReader
from io import BytesIO
from pdf2image import convert_from_bytes 
from dotenv import load_dotenv
load_dotenv()
riciclo_bp = Blueprint('riciclo', __name__)

OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"
# Recupera la chiave dal file .env del backend
OPENAI_KEY = os.getenv("OPENAI_API_KEY") 

# Prompt unico per l'AI
PROMPT_ANALISI = (
    "Analizza questo documento (fattura o certificato di riciclo) e rispondi ESCLUSIVAMENTE con un JSON nel seguente formato: "
    "{'badge_sbloccabile': bool, 'is_smartphone': bool, 'is_ricondizionato': bool, "
    "'ha_contributo_raee': string (attestato_riciclo, scontrino, nessuno), 'modello': string}. "
    "Assicurati di identificare se si tratta di un dispositivo USATO/RICONDIZIONATO o di un conferimento RAEE."
    """
    Sei l'Assistente AI Ufficiale di EcoTracker, un software che deve sensibilizzar esulle scelte ambientali, in seguito alla richiesta dell'utente tu devi inserire 
    le possibilita principali di come riciclarlo o, qualora non volessero riciclarli o siano oggetti non riciclabili, spiegare perché e suggerire alternative sostenibili.
    1. Sii breve, schematico e pratico. Usa elenchi puntati.
    2. Specifica sempre che i dispositivi elettronici NON vanno mai buttati nell'indifferenziata.
    3. Se l'utente ti chiede cose non inerenti all'ecologia o ai dispositivi (es. ricette, programmazione, storia), rifiutati cortesemente di rispondere e riporta il focus sui RAEE.
    """
)

def chiama_openai_testo(testo):
    headers = {"Authorization": f"Bearer {OPENAI_KEY}", "Content-Type": "application/json"}
    payload = {
        "model": "gpt-4o-mini", 
        "messages": [
            {"role": "system", "content": "Sei un assistente esperto in sostenibilità e documenti fiscali."},
            {"role": "user", "content": f"{PROMPT_ANALISI}\n\nDocumento:\n{testo}"}
        ],
        "response_format": { "type": "json_object" } 
    }
    response = requests.post(OPENAI_API_URL, json=payload, headers=headers)
    
    # IL CONTROLLO CHE CI SALVA LA VITA:
    if response.status_code != 200:
        raise Exception(f"Errore OpenAI (Testo): {response.text}")
        
    return response.json()['choices'][0]['message']['content']

def chiama_openai_vision(immagine_base64):
    headers = {"Authorization": f"Bearer {OPENAI_KEY}", "Content-Type": "application/json"}
    payload = {
        "model": "gpt-4o-mini", 
        "messages": [
            {"role": "user", "content": [
                {"type": "text", "text": PROMPT_ANALISI},
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{immagine_base64}"}}
            ]}
        ],
        "response_format": { "type": "json_object" }
    }
    response = requests.post(OPENAI_API_URL, json=payload, headers=headers)
    
    # IL CONTROLLO CHE CI SALVA LA VITA:
    if response.status_code != 200:
        raise Exception(f"Errore OpenAI (Vision): {response.text}")
        
    return response.json()['choices'][0]['message']['content']

@riciclo_bp.route('/api/valida-documento', methods=['POST'])
def valida_documento():
    if 'file' not in request.files:
        return jsonify({"ok": False, "errore": "Nessun file caricato"}), 400
    
    file = request.files['file']
    filename = file.filename.lower()
    file_bytes = file.read() 
    
    try:
        json_risposta = None
        
        # --- CASO 1: IMMAGINE DIRETTA (PNG/JPG) ---
        if filename.endswith(('.png', '.jpg', '.jpeg')):
            print(f"📸 LOG: Rilevata immagine {filename}. Uso OpenAI Vision.")
            immagine_base64 = base64.b64encode(file_bytes).decode('utf-8')
            json_risposta = chiama_openai_vision(immagine_base64)
            
        # --- CASO 2: PDF ---
        elif filename.endswith('.pdf'):
            print(f"📄 LOG: Rilevato PDF {filename}. Provo estrazione testo...")
            
            reader = PdfReader(BytesIO(file_bytes))
            testo_estratto = ""
            for page in reader.pages:
                testo_estratto += page.extract_text() or ""
                
            if testo_estratto.strip():
                print("✅ LOG: Testo trovato nel PDF. Uso GPT classico.")
                json_risposta = chiama_openai_testo(testo_estratto)
            else:
                # --- CASO 3: PDF SCANSIONATO (FOTO-PDF) ---
                print("⚠️ LOG: PDF vuoto (scansione). Converto in immagine per OpenAI Vision.")
                
                # ECCO LA MAGIA: Forziamo il percorso di Poppler qui
                path_poppler = r"C:\poppler-25.12.0\Library\bin"
                
                images = convert_from_bytes(
                    file_bytes, 
                    first_page=1, 
                    last_page=1,
                    poppler_path=path_poppler # Passiamo il percorso esatto!
                )
                
                if images:
                    img_buffer = BytesIO()
                    images[0].save(img_buffer, format='PNG')
                    immagine_base64 = base64.b64encode(img_buffer.getvalue()).decode('utf-8')
                    json_risposta = chiama_openai_vision(immagine_base64)
                else:
                    raise Exception("Impossibile convertire il PDF in immagine.")
        else:
            return jsonify({"ok": False, "errore": "Formato file non supportato"}), 400

        # Pulisce eventuali marcatori Markdown che OpenAI potrebbe aggiungere
        json_risposta_pulito = json_risposta.strip().removeprefix('```json').removesuffix('```').strip()
        risultato_finale = json.loads(json_risposta_pulito)
        
        return jsonify({
            "ok": True,
            "badge_sbloccabile": risultato_finale.get("badge_sbloccabile", False),
            "analisi": risultato_finale
        })

    except Exception as e:
        print(f"❌ ERRORE: {str(e)}")
        return jsonify({"ok": False, "errore": str(e)}), 500