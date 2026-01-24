import boto3
from boto3.dynamodb.conditions import Key
import time
from datetime import datetime
from decimal import Decimal
import os

# --- CONFIGURAZIONE ---
# Render caricherà queste variabili d'ambiente automaticamente
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

# --- FUNZIONE DI SICUREZZA (Il "Sanificatore") ---
def safe_float(valore):
    """
    Converte qualsiasi cosa (Decimal, stringa, int, None) in float.
    Se il dato è corrotto, restituisce 0.0 invece di far crashare il server.
    """
    try:
        if valore is None:
            return 0.0
        return float(valore)
    except Exception:
        return 0.0

# --- FUNZIONI PRINCIPALI ---

def registra_viaggio(username, co2, km, mezzo, start, end):
    """Salva un viaggio nel database convertendo i tipi correttamente."""
    print(f"🔄 Salvataggio viaggio per {username}...")
    try:
        user_clean = str(username).lower().strip()
        # Timestamp deve essere stringa per compatibilità col tuo DB
        timestamp_now = str(int(time.time())) 
        
        # Numeri convertiti in Decimal per DynamoDB
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
        print(f"✅ VIAGGIO SALVATO: {item}")
        return True
    except Exception as e:
        print(f"❌ ERRORE SALVATAGGIO: {e}")
        return False

def get_storico_completo(username):
    """Recupera i viaggi e li converte tutti in float per il frontend."""
    try:
        user_clean = str(username).lower().strip()
        response = table.query(KeyConditionExpression=Key('username').eq(user_clean))
        items = response.get('Items', [])
        
        storico_pulito = []
        for v in items:
            viaggio = v.copy()
            # Usiamo safe_float per evitare errori JSON
            viaggio['co2'] = safe_float(viaggio.get('co2'))
            viaggio['km'] = safe_float(viaggio.get('km'))
            storico_pulito.append(viaggio)

        # Ordina dal più recente
        storico_pulito.sort(key=lambda x: x.get('timestamp', '0'), reverse=True)
        return {"ok": True, "viaggi": storico_pulito}

    except Exception as e:
        print(f"Errore lettura storico: {e}")
        return {"ok": False, "viaggi": []}

def genera_wrapped(username):
    """Calcola le statistiche totali."""
    try:
        # Recupera i dati già puliti (sono float)
        dati = get_storico_completo(username)
        viaggi = dati.get('viaggi', [])
        
        if not viaggi: 
            return None

        # Somme sicure
        totale_co2 = sum(v['co2'] for v in viaggi)
        totale_km = sum(v['km'] for v in viaggi)
        
        # Calcolo mezzo preferito
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
        print(f"❌ ERRORE CALCOLO WRAPPED: {e}")
        return None

def get_classifica_risparmio():
    """Genera la classifica globale."""
    try:
        response = table.scan()
        data = response.get('Items', [])
        user_stats = {}
        
        for d in data:
            u = d.get('username', 'anonimo')
            val_co2 = safe_float(d.get('co2')) # Protezione dati sporchi
            
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