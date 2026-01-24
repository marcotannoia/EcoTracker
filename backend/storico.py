import boto3
from boto3.dynamodb.conditions import Key
import time
from datetime import datetime
from decimal import Decimal
import os
from dotenv import load_dotenv

load_dotenv()

# --- CONFIGURAZIONE ---
# Usa le variabili d'ambiente per sicurezza
REGION = os.getenv("AWS_REGION", "eu-south-1")
ACCESS_KEY = os.getenv("AWS_ACCESS_KEY_ID")
SECRET_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
TABLE_NAME = "EcoTrack_viaggi"

# --- CONNESSIONE AL DATABASE ---
try:
    dynamodb = boto3.resource(
        'dynamodb',
        region_name=REGION,
        aws_access_key_id=ACCESS_KEY,
        aws_secret_access_key=SECRET_KEY
    )
    table = dynamodb.Table(TABLE_NAME)
    print(f"✅ Connesso a DynamoDB: {TABLE_NAME} in {REGION}")
except Exception as e:
    print(f"❌ ERRORE CRITICO CONNESSIONE DB: {str(e)}")


# --- FUNZIONI ---

def registra_viaggio(username, co2, km, mezzo, start, end):
    """
    Salva un viaggio nel database.
    FIX: Converte i numeri in Decimal e il timestamp in Stringa per compatibilità DynamoDB.
    """
    print(f"🔄 Inizio salvataggio per {username}...")
    try:
        user_clean = str(username).lower().strip()
        
        # TIMESTAMP: Deve essere stringa perché nel tuo DB la chiave è Stringa
        timestamp_now = str(int(time.time())) 
        
        # NUMERI: DynamoDB vuole Decimal, non float
        co2_decimal = Decimal(str(co2))
        km_decimal = Decimal(str(km))

        item = {
            'username': user_clean,           # Partition Key
            'timestamp': timestamp_now,       # Sort Key (Stringa!)
            'data': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'co2': co2_decimal,
            'km': km_decimal,
            'mezzo': str(mezzo),
            'partenza': str(start),
            'arrivo': str(end)
        }

        table.put_item(Item=item)
        print(f"✅ VIAGGIO SALVATO SU DYNAMODB: {item}")
        return True

    except Exception as e:
        print(f"❌ ERRORE GRAVE DURANTE IL SALVATAGGIO: {e}")
        return False


def get_storico_completo(username):
    """
    Recupera tutti i viaggi di un utente.
    Converte i Decimal di DynamoDB in float per evitare errori JSON nel frontend.
    """
    try:
        user_clean = str(username).lower().strip()
        
        response = table.query(
            KeyConditionExpression=Key('username').eq(user_clean)
        )
        items = response.get('Items', [])
        
        # Pulizia dati: Convertiamo Decimal -> float/int per il Frontend
        storico_pulito = []
        for v in items:
            viaggio_temp = v.copy()
            # Conversione CO2
            if isinstance(viaggio_temp.get('co2'), Decimal):
                viaggio_temp['co2'] = float(viaggio_temp['co2'])
            # Conversione KM
            if isinstance(viaggio_temp.get('km'), Decimal):
                viaggio_temp['km'] = float(viaggio_temp['km'])
            
            storico_pulito.append(viaggio_temp)

        # Ordina dal più recente (basandosi sul timestamp stringa)
        storico_pulito.sort(key=lambda x: x.get('timestamp', '0'), reverse=True)
        
        return {"ok": True, "viaggi": storico_pulito}

    except Exception as e:
        print(f"Errore lettura storico: {e}")
        return {"ok": False, "viaggi": []}


def genera_wrapped(username):
    """
    Calcola le statistiche totali (Wrapped) dell'utente.
    """
    # Usiamo la funzione interna per prendere i dati
    dati = get_storico_completo(username)
    viaggi = dati.get('viaggi', [])
    
    if not viaggi: 
        print(f"Nessun viaggio trovato per {username} per il Wrapped.")
        return None

    # Calcoli statistici
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


def get_classifica_risparmio():
    """
    Genera la classifica globale aggregando i dati di tutti gli utenti.
    """
    try:
        # Scansione completa della tabella
        response = table.scan()
        data = response.get('Items', [])
        
        user_stats = {}
        
        # 1. Aggrega i dati per utente
        for d in data:
            u = d.get('username', 'anonimo')
            try:
                # Gestione robusta: converte in float sia che sia Decimal o altro
                raw_co2 = d.get('co2', 0)
                val_co2 = float(raw_co2)
                
                if u not in user_stats:
                    user_stats[u] = 0.0
                user_stats[u] += val_co2
            except Exception as e: 
                continue # Salta dati corrotti
            
        # 2. Crea la lista finale ordinata
        classifica = []
        for user, totale in user_stats.items():
            totale_round = round(totale, 2)
            
            classifica.append({
                "username": user,
                "co2": totale_round,          
                "risparmio": totale_round,    
                "score": int(totale_round),
                "regione": "Global", # Placeholder
                "avatar": user[0].upper() if user else "?"
            })
            
        # Ordina decrescente in base alla CO2
        classifica.sort(key=lambda x: x['co2'], reverse=True)
        
        return classifica[:10] # Ritorna la Top 10
        
    except Exception as e:
        print(f"❌ Errore GRAVE classifica: {str(e)}")
        return []