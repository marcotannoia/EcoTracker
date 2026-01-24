import boto3
from boto3.dynamodb.conditions import Key
import time
import os
from decimal import Decimal # Fondamentale per DynamoDB
from dotenv import load_dotenv

load_dotenv()

# Configurazione
REGION = os.getenv("AWS_REGION", "eu-south-1")
ACCESS_KEY = os.getenv("AWS_ACCESS_KEY_ID")
SECRET_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
TABLE_NAME = "EcoTrack_viaggi"

# Connessione DB (Con stampa errore se fallisce)
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
    print(f"❌ ERRORE CRITICO DB: {str(e)}")

# Funzione di aiuto per convertire Decimali in float/int (Salva Flask dai crash)
def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    return obj

def registra_viaggio(username, co2, km, mezzo, start, end):
    try:
        # Forziamo username minuscolo per coerenza
        user_clean = str(username).lower().strip()
        
        item = {
            'username': user_clean,
            'timestamp': int(time.time()), # Numero, non stringa
            'data': time.strftime("%Y-%m-%d %H:%M:%S"),
            'co2': str(co2), # Salviamo come stringa per sicurezza
            'km': str(km),
            'mezzo': str(mezzo),
            'partenza': str(start),
            'arrivo': str(end)
        }
        table.put_item(Item=item)
        print(f"Viaggio salvato per {user_clean}")
        return True
    except Exception as e:
        print(f"Errore salvataggio viaggio: {e}")
        return False

def get_storico_completo(username):
    try:
        # Cerca sempre in minuscolo
        user_clean = str(username).lower().strip()
        
        response = table.query(KeyConditionExpression=Key('username').eq(user_clean))
        items = response.get('Items', [])
        
        storico = []
        for v in items:
            try:
                # Conversione sicura dei dati
                v['co2'] = float(v.get('co2', 0))
                v['km'] = float(v.get('km', 0))
                # Gestione Decimali per il timestamp
                if isinstance(v.get('timestamp'), Decimal):
                    v['timestamp'] = int(v['timestamp'])
                storico.append(v)
            except Exception as e:
                print(f"Errore lettura riga storico: {e}")
                continue
            
        storico.sort(key=lambda x: x.get('timestamp', 0), reverse=True)
        return storico
    except Exception as e:
        print(f"Errore get_storico_completo: {e}")
        return []

def genera_wrapped(username):
    # Questa funzione ora usa la versione robusta di get_storico
    viaggi = get_storico_completo(username)
    
    # Se non ci sono viaggi, restituiamo None
    if not viaggi: 
        print(f"Nessun viaggio trovato per {username}")
        return None

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
    Genera la classifica aggregando i dati.
    """
    try:
        # Scan completo (Attenzione: su DB enormi è lento, per ora va bene)
        response = table.scan()
        data = response.get('Items', [])
        print(f"Scansione Classifica: trovati {len(data)} viaggi totali nel DB")
        
        user_stats = {}
        
        # 1. Aggrega i dati
        for d in data:
            u = d.get('username', 'sconosciuto')
            try:
                # Convertiamo qualunque cosa sia 'co2' in float
                raw_co2 = d.get('co2', 0)
                valore_co2 = float(raw_co2)
                
                if u not in user_stats:
                    user_stats[u] = 0.0
                user_stats[u] += valore_co2
            except Exception as e: 
                # Se un dato è corrotto, lo saltiamo ma lo logghiamo
                # print(f"Dato corrotto per {u}: {e}")
                continue
            
        # 2. Crea la lista finale
        classifica = []
        for user, totale in user_stats.items():
            totale_round = round(totale, 2)
            
            # Creiamo un oggetto utente per la classifica
            classifica.append({
                "username": user,
                "co2": totale_round,          
                "risparmio": totale_round,    
                "score": int(totale_round),
                # Mettiamo un placeholder, dato che la tabella viaggi non ha la regione
                "regione": "Global",         
                "avatar": user[0].upper() if user else "?"
            })
            
        # Ordina
        classifica.sort(key=lambda x: x['co2'], reverse=True)
        
        print(f"Classifica generata: {len(classifica)} utenti")
        return classifica[:10] # Top 10
        
    except Exception as e:
        print(f"❌ Errore GRAVE classifica: {str(e)}")
        return []