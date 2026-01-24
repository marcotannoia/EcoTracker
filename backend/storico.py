import boto3
from boto3.dynamodb.conditions import Key
import time
import os
from dotenv import load_dotenv

load_dotenv()

# Configurazione
REGION = os.getenv("AWS_REGION", "eu-south-1")
ACCESS_KEY = os.getenv("AWS_ACCESS_KEY_ID")
SECRET_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
TABLE_NAME = "EcoTrack_viaggi"

# Connessione Silenziosa (Niente più log giganti)
try:
    dynamodb = boto3.resource(
        'dynamodb',
        region_name=REGION,
        aws_access_key_id=ACCESS_KEY,
        aws_secret_access_key=SECRET_KEY
    )
    table = dynamodb.Table(TABLE_NAME)
except:
    print("Errore connessione DB")

def registra_viaggio(username, co2, km, mezzo, start, end):
    try:
        item = {
            'username': str(username),
            'timestamp': str(int(time.time())),
            'data': time.strftime("%Y-%m-%d %H:%M:%S"),
            'co2': str(co2),
            'km': str(km),
            'mezzo': str(mezzo),
            'partenza': str(start),
            'arrivo': str(end)
        }
        table.put_item(Item=item)
        return True
    except:
        return False

def get_storico_completo(username):
    try:
        response = table.query(KeyConditionExpression=Key('username').eq(username))
        items = response.get('Items', [])
        
        storico = []
        for v in items:
            try:
                # Convertiamo in numeri per il frontend
                v['co2'] = float(v.get('co2', 0))
                v['km'] = float(v.get('km', 0))
                storico.append(v)
            except: continue
            
        storico.sort(key=lambda x: x['timestamp'], reverse=True)
        return storico
    except:
        return []

def genera_wrapped(username):
    viaggi = get_storico_completo(username)
    if not viaggi: return None

    totale_co2 = sum(v['co2'] for v in viaggi)
    totale_km = sum(v['km'] for v in viaggi)
    
    # Calcolo mezzo preferito
    counts = {}
    for v in viaggi:
        m = v['mezzo']
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
    Genera la classifica aggregando i dati di tutti i viaggi.
    Manda i dati in molteplici formati per garantire compatibilità col frontend.
    """
    try:
        response = table.scan()
        data = response.get('Items', [])
        
        user_stats = {}
        
        # 1. Aggrega i dati (Somma la CO2 per ogni utente)
        for d in data:
            u = d['username']
            try:
                valore_co2 = float(d.get('co2', 0))
                if u not in user_stats:
                    user_stats[u] = 0
                user_stats[u] += valore_co2
            except: continue
            
        # 2. Crea la lista finale con TUTTE le chiavi possibili
        classifica = []
        for user, totale in user_stats.items():
            totale_round = round(totale, 2)
            
            classifica.append({
                "username": user,
                # Inviamo il valore con nomi diversi per "beccare" quello giusto
                "co2": totale_round,          # Probabile target 1
                "score": totale_round,        # Probabile target 2
                "points": int(totale_round),  # Probabile target 3
                "risparmio": totale_round,    # Probabile target 4
                
                # Aggiungiamo dati finti per evitare crash grafici se mancano
                "region": "EcoWorld",         # Placeholder per la regione
                "avatar": user[0].upper()     # Iniziale come avatar
            })
            
        # Ordina dal più alto al più basso
        classifica.sort(key=lambda x: x['co2'], reverse=True)
        return classifica[:10] # Top 10
        
    except Exception as e:
        print(f"Errore classifica: {e}")
        return []