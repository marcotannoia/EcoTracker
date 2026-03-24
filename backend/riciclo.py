import os
import requests
import base64
import json
import hashlib
import boto3
import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify
from pypdf import PdfReader
from io import BytesIO
from pdf2image import convert_from_bytes 
from PIL import Image
import imagehash
from dotenv import load_dotenv

load_dotenv()
riciclo_bp = Blueprint('riciclo', __name__)

OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"
OPENAI_KEY = os.getenv("OPENAI_API_KEY") 
AWS_REGION = "eu-south-1"
BUCKET_NAME = os.getenv("AWS_S3_BUCKET_NAME")
TABLE_NAME = os.getenv("AWS_DYNAMODB_TABLE")

s3_client = boto3.client('s3', region_name=AWS_REGION)
dynamodb_client = boto3.client('dynamodb', region_name=AWS_REGION)

# istruzioni
PROMPT_ANALISI = (
    "Analizza questo documento (fattura o certificato di riciclo) e rispondi ESCLUSIVAMENTE con un JSON nel seguente formato: "
    "{'badge_sbloccabile': bool, 'is_smartphone': bool, 'is_ricondizionato': bool, "
    "'ha_contributo_raee': string (attestato_riciclo, scontrino, nessuno), 'modello': string, "
    "'spiegazione_umana': string}. " 
    "Nel campo 'spiegazione_umana' scrivi 2-3 righe semplici per l'utente spiegando il PERCHÉ della scelta. "
    "Esempio: 'Ho visto che è un Notebook, ma noi premiamo solo gli smartphone, quindi niente badge!' oppure "
    "'Grande! È un iPhone ricondizionato, ti meriti il badge!'. "
    """
    Sei l'Assistente AI di EcoTracker.
    1. Sii breve e pratico. Usa elenchi puntati.
    2. Ricorda: i RAEE non vanno mai buttati nell'indifferenziata.
    3. Se ti chiedono cose che non c'entrano con l'ecologia, rifiutati gentilmente.
    """
)

def chiedi_a_gpt_testo(testo_estratto): # struttura presa da documentazioni di Openai
    headers = {"Authorization": f"Bearer {OPENAI_KEY}", "Content-Type": "application/json"}
    payload = {
        "model": "gpt-4o-mini", 
        "messages": [
            {"role": "system", "content": "Sei un esperto di sostenibilità e documenti fiscali."},
            {"role": "user", "content": f"{PROMPT_ANALISI}\n\nTesto del documento:\n{testo_estratto}"}
        ],
        "response_format": { "type": "json_object" } 
    }
    risposta = requests.post(OPENAI_API_URL, json=payload, headers=headers)
    
    if risposta.status_code != 200:
        raise Exception(f"Errore OpenAI (Testo): {risposta.text}")
        
    return risposta.json()['choices'][0]['message']['content']

def chiedi_a_gpt_visione(immagine_b64): # per i PNG e altro, segue struttura di openai
    headers = {"Authorization": f"Bearer {OPENAI_KEY}", "Content-Type": "application/json"}
    payload = {
        "model": "gpt-4o-mini", 
        "messages": [
            {"role": "user", "content": [
                {"type": "text", "text": PROMPT_ANALISI},
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{immagine_b64}"}}
            ]}
        ],
        "response_format": { "type": "json_object" }
    }
    risposta = requests.post(OPENAI_API_URL, json=payload, headers=headers)
    
    if risposta.status_code != 200: # solito errore generico
        raise Exception(f"Errore OpenAI (Vision): {risposta.text}")
        
    return risposta.json()['choices'][0]['message']['content']

def genera_identikit_file(byte_file, nome_file):  #hasha il file
    codice_sha = hashlib.sha256(byte_file).hexdigest()
    impronta_visiva = "N/A"
    
    if nome_file.endswith(('.png', '.jpg', '.jpeg')):
        try:
            img = Image.open(BytesIO(byte_file))
            impronta_visiva = str(imagehash.phash(img))
        except Exception as e:
            print(f"⚠️ Occhio, errore pHash: {e}")
            
    return codice_sha, impronta_visiva

def controlla_se_gia_visto(codice_sha): # check se il file è già stato caricato
    try:
        risultato = dynamodb_client.query(
            TableName=TABLE_NAME,
            IndexName='Sha256Index',
            KeyConditionExpression='sha256 = :h',
            ExpressionAttributeValues={':h': {'S': codice_sha}}
        )
        return len(risultato.get('Items', [])) > 0
    except Exception as e:
        print(f"⚠️ Errore DynamoDB (vado avanti comunque): {e}")
        return False

def carica_su_cloud(byte_file, nome_file, id_utente):  
    estensione = nome_file.split('.')[-1]
    nome_nuovo = f"{id_utente}_{uuid.uuid4().hex}.{estensione}"
    path_s3 = f"caricamenti/{nome_nuovo}"
    
    s3_client.put_object(
        Bucket=BUCKET_NAME,
        Key=path_s3,
        Body=byte_file,
        ContentType=f"image/{estensione}" if estensione in ['png', 'jpg', 'jpeg'] else "application/pdf"
    )
    return f"s3://{BUCKET_NAME}/{path_s3}"

@riciclo_bp.route('/api/valida-documento', methods=['POST'])
def valida_doc():
    if 'file' not in request.files:
        return jsonify({"ok": False, "errore": "Zio, manca il file!"}), 400
    
    id_utente = request.form.get('user_id', 'utente_generico')
    file = request.files['file']
    nome_file = file.filename.lower()
    dati_file = file.read() 
    
    try:
        # --- 1. SICUREZZA ANTI-CLONE ---
        print("🔍 Controllo se questo file è un clone...")
        sha_file, hash_visivo = genera_identikit_file(dati_file, nome_file)
        
        if controlla_se_gia_visto(sha_file):
            print(f"🚨 Beccato! Il file {nome_file} è già stato usato.")
            return jsonify({
                "ok": False, 
                "errore": "Questo documento è già presente nel sistema.",
                "codice": "GIA_VISTO"
            }), 403

        # --- 2. ARCHIVIAZIONE ---
        print("☁️ File nuovo, lo sto buttando sul Cloud...")
        link_s3 = carica_su_cloud(dati_file, nome_file, id_utente)
        
        # --- 3. ANALISI INTELLIGENTE ---
        risposta_gpt = None
        
        if nome_file.endswith(('.png', '.jpg', '.jpeg')):
            print(f"📸 È una foto. Chiedo aiuto a GPT Vision.")
            immagine_b64 = base64.b64encode(dati_file).decode('utf-8')
            risposta_gpt = chiedi_a_gpt_visione(immagine_b64)
            
        elif nome_file.endswith('.pdf'):
            print(f"📄 È un PDF. Provo a leggere il testo...")
            lettore = PdfReader(BytesIO(dati_file))
            testo = ""
            for pagina in lettore.pages:
                testo += pagina.extract_text() or ""
                
            if testo.strip():
                print("✅ Testo trovato! Uso GPT Standard.")
                risposta_gpt = chiedi_a_gpt_testo(testo)
            else:
                print("⚠️ PDF vuoto (scansione). Lo converto in immagine...")
                path_poppler = r"C:\poppler-25.12.0\Library\bin"
                pagine_img = convert_from_bytes(dati_file, first_page=1, last_page=1, poppler_path=path_poppler)
                
                if pagine_img:
                    buffer = BytesIO()
                    pagine_img[0].save(buffer, format='PNG')
                    immagine_b64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
                    risposta_gpt = chiedi_a_gpt_visione(immagine_b64)
                else:
                    raise Exception("Non sono riuscito a convertire il PDF.")
        else:
            return jsonify({"ok": False, "errore": "Formato non supportato"}), 400

        # Pulizia e parsing del verdetto
        risposta_pulita = risposta_gpt.strip().removeprefix('```json').removesuffix('```').strip()
        verdetto = json.loads(risposta_pulita)
        
        # --- 4. MEMORIA STORICA (DYNAMODB) ---
        print("🗄️ Salvo il verdetto finale nel database...")
        dynamodb_client.put_item(
            TableName=TABLE_NAME,
            Item={
                'user_id': {'S': id_utente},
                'doc_id': {'S': uuid.uuid4().hex},
                'sha256': {'S': sha_file},
                'phash': {'S': hash_visivo},
                's3_url': {'S': link_s3},
                'badge_sbloccabile': {'BOOL': verdetto.get("badge_sbloccabile", False)},
                'dati_ai': {'S': json.dumps(verdetto)},
                'data_ora': {'S': datetime.now().isoformat()}
            }
        )
        
        return jsonify({
            "ok": True,
            "badge_sbloccabile": verdetto.get("badge_sbloccabile", False),
            "messaggio": verdetto.get("spiegazione_umana"),
            "dettagli": verdetto
        })

    except Exception as e:
        print(f"❌ Casini nel server: {str(e)}")
        return jsonify({"ok": False, "errore": str(e)}), 500