import requests
import os
import urllib.parse

GOOGLE_MAPS_API_KEY = os.environ.get("GOOGLE_API_KEY") # se la volete poi ve la mando ma l-ho messa  nel gitignore e env fille cosi non ce la hackerano

def get_google_distance(partenza, arrivo): # prendo nel metodo destinazione e arrivo
    
    endpoint = "https://maps.googleapis.com/maps/api/directions/json"  
    
    params = { # parametri imposti dall'api di google
        'origin': partenza,
        'destination': arrivo,
        'key': os.environ.get("GOOGLE_API_KEY") ,
        'units': 'metric',
        'language': 'it'  
    }

    try:
        response = requests.get(endpoint, params=params)
        data = response.json()

        if data['status'] == 'OK': # vedo se le api hanno trovato la strada, scelgo la prima e prendo cio che mi interessa nel return
            percorso = data['routes'][0]['legs'][0]
            
            return {
                "distanza_testo": percorso['distance']['text'],  
                "distanza_valore": percorso['distance']['value'],  # purtroppo me lo da in metri quindi poi lo convertiro
                "durata": percorso['duration']['text'],          
                "start_address": percorso['start_address'],      
                "end_address": percorso['end_address']
            }
        else:
            print(f"Errore Google: {data['status']}")
            return None

    except Exception as e:
        print(f"Errore connessione: {e}") # gestisco sta eccezione generale per farmi un idea 
        return None

def get_embed_map_url(partenza, destinatione): #introduzione  mappa interattiva
    if not partenza or not destinatione:
        return None
        
    
    base_url = "https://www.google.com/maps/embed/v1/directions" # endpoint mappa interattiva
    
    params = {
        'key': GOOGLE_MAPS_API_KEY,
        'origin': partenza,
        'destination': destinatione,
        'mode': 'driving', 
        'language': 'it'
    }
    
    # query socira
    query_string = urllib.parse.urlencode(params)
    return f"{base_url}?{query_string}"