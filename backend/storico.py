import boto3
from boto3.dynamodb.conditions import Key
import time
from datetime import datetime
from decimal import Decimal
import os

# --- CONFIGURAZIONE ---
REGION = os.environ.get("AWS_REGION", "eu-south-1")
ACCESS_KEY = os.environ.get("AWS_ACCESS_KEY_ID")
SECRET_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")
TABLE_NAME = "EcoTrack_viaggi"

# --- CONNESSIONE DYNAMODB ---
try:
    dynamodb = boto3.resource(
        'dynamodb',
        region_name=REGION,
        aws_access_key_id=ACCESS_KEY,
        aws_secret_access_key=SECRET_KEY
    )
    table = dynamodb.Table(TABLE_NAME)
    print(f"✅ Connesso a DynamoDB: {TABLE_NAME}")
except Exception as e:
    print(f"❌ ERRORE CRITICO DB: {str(e)}")

# --- FUNZIONE SALVA-VITA (Il Filtro) ---
def safe_float(valore):
    """
    Pulisce i dati sporchi.
    Se trova "10 kg" o None, restituisce 0.0 invece di far crashare tutto.
    """
    try:
        if valore is None:
            return 0.0
        # Se è già un numero, ok
        if isinstance(valore, (int, float, Decimal)):
            return float(valore)
        # Se è una stringa, prova a pulirla
        valore_str = str(valore).replace(',', '.') # Gestisce virgole
        # Rimuove testo extra (es. " kg") se presente
        import re
        valore_clean = re.sub(r'[^\d.]', '', valore_str) 
        if not valore_clean: return 0.0
        return float(valore_clean)
    except Exception:
        return 0.0

# --- FUNZIONI PRINCIPALI ---

def registra_viaggio(username, co2, km, mezzo, start, end):
    print(f"🔄 Salvataggio per {username}...")
    try:
        user_clean = str(username).lower().strip()
        timestamp_now = str(int(time.time())) 
        
        # Salvataggio sicuro in Decimal
        item = {
            'username': user_clean,           
            'timestamp': timestamp_now,       
            'data': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'co2': Decimal(str(co2)),
            'km': Decimal(str(km)),
            'mezzo': str(mezzo),
            'partenza': str(start),
            'arrivo': str(end)
        }
        table.put_item(Item=item)
        print(f"✅ SALVATO: {item}")
        return True
    except Exception as e:
        print(f"❌ ERRORE SALVATAGGIO: {e}")
        return False

def get_storico_completo(username):
    try:
        user_clean = str(username).lower().strip()
        response = table.query(KeyConditionExpression=Key('username').eq(user_clean))
        items = response.get('Items', [])
        
        storico_pulito = []
        for v in items:
            viaggio = v.copy()
            # PULIZIA DATI QUI!
            viaggio['co2'] = safe_float(viaggio.get('co2'))
            viaggio['km'] = safe_float(viaggio.get('km'))
            storico_pulito.append(viaggio)

        storico_pulito.sort(key=lambda x: x.get('timestamp', '0'), reverse=True)
        return {"ok": True, "viaggi": storico_pulito}

    except Exception as e:
        print(f"Errore storico: {e}")
        return {"ok": False, "viaggi": []}

def genera_wrapped(username):
    try:
        # Prende i dati già puliti da get_storico_completo
        dati = get_storico_completo(username)
        viaggi = dati.get('viaggi', [])
        
        if not viaggi: 
            return None

        # Ora la somma è sicura al 100%
        totale_co2 = sum(v['co2'] for v in viaggi)
        totale_km = sum(v['km'] for v in viaggi)
        
        counts = {}
        for v in viaggi:
            m = v.get('mezzo', 'sconosciuto')
            counts[m] = counts.get(m, 0) + 1
        best_mezzo = max(counts, key=counts.get) if counts else "Nessuno"

        return {
            "viaggi_totali": len(viaggi),
            "co2_risparmiata": round(totale_co2, 2),
            "km_totali": round(totale_km, 2),
            "mezzo_preferito": best_mezzo
        }
    except Exception as e:
        print(f"❌ ERRORE WRAPPED: {e}")
        return None

def get_classifica_risparmio():
    try:
        response = table.scan()
        data = response.get('Items', [])
        user_stats = {}
        
        for d in data:
            u = d.get('username', 'anonimo')
            # Pulizia anche qui per la classifica
            val_co2 = safe_float(d.get('co2'))
            
            if u not in user_stats: user_stats[u] = 0.0
            user_stats[u] += val_co2
            
        classifica = []
        for user, totale in user_stats.items():
            totale_round = round(totale, 2)
            classifica.append({
                "username": user,
                "co2": totale_round,          
                "risparmio": totale_round,    
                "score": int(totale_round),
                "regione": "Global",
                "avatar": user[0].upper() if user else "?"
            })
        classifica.sort(key=lambda x: x['co2'], reverse=True)
        return classifica[:10]
    except Exception as e:
        return []