import boto3
from boto3.dynamodb.conditions import Key
import time
from datetime import datetime
from decimal import Decimal
import os
import re

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

# --- IL PULITORE ---
def safe_float(valore):
    try:
        if valore is None: return 0.0
        if isinstance(valore, (int, float, Decimal)):
            return float(valore)
        s = str(valore).replace(',', '.') 
        s = re.sub(r'[^\d.]', '', s)
        if not s: return 0.0
        return float(s)
    except:
        return 0.0

# --- FUNZIONI ---

def registra_viaggio(username, co2, km, mezzo, start, end):
    try:
        user_clean = str(username).lower().strip()
        timestamp_now = str(int(time.time())) 
        
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
        dati = get_storico_completo(username)
        viaggi = dati.get('viaggi', [])
        
        if not viaggi: return None

        # --- FIX CALCOLO RISPARMIO NEL WRAPPED ---
        totale_km = 0
        totale_risparmio = 0
        CO2_AUTO_STANDARD = 0.120

        counts = {}

        for v in viaggi:
            km = safe_float(v.get('km'))
            co2_emessa = safe_float(v.get('co2'))
            m = v.get('mezzo', 'sconosciuto')
            
            # Statistiche base
            totale_km += km
            counts[m] = counts.get(m, 0) + 1

            # Calcolo Risparmio
            co2_se_fosse_auto = km * CO2_AUTO_STANDARD
            risparmio = co2_se_fosse_auto - co2_emessa
            if risparmio < 0: risparmio = 0
            
            totale_risparmio += risparmio

        best_mezzo = max(counts, key=counts.get) if counts else "Nessuno"

        return {
            "viaggi_totali": len(viaggi),
            "co2_risparmiata": round(totale_risparmio, 2), # ORA È GIUSTO
            "km_totali": round(totale_km, 2),
            "mezzo_preferito": best_mezzo
        }
    except Exception as e:
        print(f"❌ ERRORE CALCOLO WRAPPED: {e}")
        return None

def get_classifica_risparmio():
    try:
        response = table.scan()
        data = response.get('Items', [])
        user_stats = {}
        
        CO2_AUTO_STANDARD = 0.120 

        for d in data:
            u = d.get('username', 'anonimo')
            val_co2_emessa = safe_float(d.get('co2')) 
            val_km = safe_float(d.get('km'))

            # --- LA LOGICA CORRETTA ---
            # 1. Quanto inquina un'auto normale per fare quei km?
            baseline_auto = val_km * CO2_AUTO_STANDARD
            
            # 2. Quanto ho risparmiato io? (Auto - Le mie emissioni)
            risparmio = baseline_auto - val_co2_emessa
            
            # 3. Niente numeri negativi (se inquini più dell'auto prendi 0)
            if risparmio < 0: risparmio = 0

            if u not in user_stats: user_stats[u] = 0.0
            user_stats[u] += risparmio
            
        classifica = []
        for user, totale in user_stats.items():
            totale_round = round(totale, 2)
            classifica.append({
                "username": user,
                "co2": totale_round,          # Mostra il risparmio
                "risparmio": totale_round,    
                "score": int(totale_round * 10), 
                "regione": "Global",
                "avatar": user[0].upper() if user else "?"
            })
        classifica.sort(key=lambda x: x['co2'], reverse=True)
        return classifica[:10]
    except Exception as e:
        return []