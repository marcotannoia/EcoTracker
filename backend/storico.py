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

# --- CONNESSIONE ---
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

# --- FUNZIONE DI PULIZIA DATI ---
def safe_float(valore):
    """Converte qualsiasi cosa (Decimal, stringa, int) in float in modo sicuro."""
    try:
        if valore is None: return 0.0
        return float(valore)
    except Exception:
        return 0.0

# --- FUNZIONI CORE ---

def registra_viaggio(username, co2, km, mezzo, start, end):
    try:
        user_clean = str(username).lower().strip()
        timestamp_now = str(int(time.time())) 
        
        # Salviamo come Decimal per correttezza su DynamoDB
        co2_decimal = Decimal(str(co2))
        km_decimal = Decimal(str(km))

        item = {
            'username': user_clean,           
            'timestamp': timestamp_now,       
            'data': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'co2': co2_decimal,
            'km': km_decimal,
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
        
        # PULIZIA DATI FONDAMENTALE
        storico_pulito = []
        for v in items:
            viaggio = v.copy()
            # Forziamo la conversione in float di TUTTO per evitare crash
            viaggio['co2'] = safe_float(viaggio.get('co2'))
            viaggio['km'] = safe_float(viaggio.get('km'))
            storico_pulito.append(viaggio)

        storico_pulito.sort(key=lambda x: x.get('timestamp', '0'), reverse=True)
        return {"ok": True, "viaggi": storico_pulito}

    except Exception as e:
        print(f"Errore storico: {e}")
        return {"ok": False, "viaggi": []}

def genera_wrapped(username):
    # Usa get_storico_completo che ora restituisce numeri puliti (float)
    dati = get_storico_completo(username)
    viaggi = dati.get('viaggi', [])
    
    if not viaggi: 
        return None

    # Ora la somma è sicura perché sono tutti float!
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

def get_classifica_risparmio():
    try:
        response = table.scan()
        data = response.get('Items', [])
        user_stats = {}
        
        for d in data:
            u = d.get('username', 'anonimo')
            val_co2 = safe_float(d.get('co2')) # Usa la conversione sicura
            
            if u not in user_stats:
                user_stats[u] = 0.0
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
        print(f"❌ Errore classifica: {str(e)}")
        return []