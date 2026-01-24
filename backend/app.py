from flask import Flask, jsonify, request, session
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix 
import maps
import calcoloCO2
from mezzo import opzione_trasporto
import login as auth_service 
import storico
from alberiCO2 import alberiCO2
import os

app = Flask(__name__)

# --- 1. CONFIGURAZIONE SICUREZZA ---
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)
app.secret_key = os.environ.get("SECRET_KEY", "chiave-segreta-super-sicura")

# Impostazioni Cookie
app.config['SESSION_COOKIE_SAMESITE'] = 'None' 
app.config['SESSION_COOKIE_SECURE'] = True      
app.config['SESSION_COOKIE_HTTPONLY'] = True    

# --- 2. CORS (PERMISSIVO PER EVITARE BLOCCHI DATI) ---
# Ho messo origins="*" per sbloccare la visualizzazione dati da qualsiasi fonte (incluso localhost)
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# --- ROTTE AUTENTICAZIONE ---

@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json() or {}
    username_input = data.get('username', '').lower().strip()
    password_input = data.get('password')
    
    user = auth_service.login_user(username_input, password_input)
    
    if user:
        session.permanent = True
        session['username'] = user['username']
        session['ruolo'] = user.get('role', 'utente')
        session['regione'] = user.get('regione', '') 
        return jsonify({
            "ok": True, 
            "username": user['username'], 
            "ruolo": session['ruolo'], 
            "regione": session['regione']
        })
    
    return jsonify({"ok": False, "errore": "Credenziali errate"}), 401

@app.route('/api/registrati', methods=['POST'])
def api_registrati():
    data = request.get_json() or {}
    username = data.get('username', '').lower().strip()
    return jsonify(auth_service.register_user(username, data.get('password'), data.get('regione'), data.get('email')))

@app.route('/api/conferma', methods=['POST'])
def api_conferma():
    data = request.get_json() or {}
    return jsonify(auth_service.verify_user(data.get('username', '').lower().strip(), data.get('codice')))

@app.route('/api/logout', methods=['POST'])
def api_logout():
    session.clear()
    return jsonify({"ok": True})

@app.route('/api/me', methods=['GET'])
def api_me():
    user = session.get('username')
    if user:
        return jsonify({
            "ok": True, 
            "username": user, 
            "ruolo": session.get('ruolo'), 
            "regione": session.get('regione', ''),
            "is_logged": True
        })
    return jsonify({"ok": False, "is_logged": False}), 401

@app.route('/api/utenti', methods=['GET'])
def get_utenti():
    try:
        lista = auth_service.get_users_list()
        # Assicuro che ritorni sempre una lista, anche vuota
        return jsonify({"ok": True, "utenti": lista if lista else []})
    except Exception as e:
        print(f"Errore utenti: {e}")
        return jsonify({"ok": False, "utenti": []})

# --- VEICOLI ---
@app.route('/api/veicoli', methods=['GET'])
def vehicles():
    return jsonify(opzione_trasporto()) 

# --- NAVIGAZIONE E SALVATAGGIO ---
@app.route('/api/navigazione', methods=['POST'])
def navigazione():
    data = request.get_json() or {} 
    start, end = data.get('start'), data.get('end')
    mezzo = data.get('mezzo', 'car')

    if not start or not end:
        return jsonify({"ok": False, "errore": "Indirizzi mancanti"}), 400
    
    route = maps.get_google_distance(start, end)  
    
    if not route:
        return jsonify({"ok": False, "errore": "Percorso non trovato"}), 400

    distanza_km = route.get('distanza_valore', 0) / 1000.0

    if mezzo in ['bike', 'piedi', 'veicolo_elettrico']:
        emissioni = 0
    else:
        emissioni = calcoloCO2.calcoloCO2(distanza_km, mezzo)

    current_username = session.get('username') 
    
    if current_username:
        try:
            esito = storico.registra_viaggio(
                username=current_username,
                co2=emissioni,
                km=distanza_km,
                mezzo=mezzo,
                start=route.get('start_address'), 
                end=route.get('end_address')      
            )
            if esito:
                print(f"✅ Viaggio salvato per {current_username}")
        except Exception as e:
             print(f"❌ Errore salvataggio: {e}")
    
    map_url = maps.get_embed_map_url(route.get('start_address'), route.get('end_address'))

    return jsonify({
        "ok": True,
        "start_address": route.get('start_address'),
        "end_address": route.get('end_address'),
        "distanza_testo": route.get('distanza_testo'),
        "emissioni_co2": f"{emissioni:.2f} kg di CO₂", 
        "mezzo_scelto": mezzo,
        "is_logged": bool(current_username),
        "map_url": map_url
    })

# --- STORICO ---
@app.route('/api/storico', methods=['GET'])
def api_storico():
    user = session.get('username')
    if not user: return jsonify({"ok": False, "errore": "Login richiesto"}), 401
    
    dati = storico.get_storico_completo(user)
    return jsonify(dati)


# --- ROTTA WRAPPED (DATI PROFILO) ---
@app.route('/api/wrapped', defaults={'username': None}, methods=['GET'])
@app.route('/api/wrapped/<username>', methods=['GET'])
def api_wrapped(username):
    current_username = session.get('username')
    target_user = username if username else current_username
    
    if not target_user:
        return jsonify({"ok": False, "errore": "Utente non specificato"}), 401 

    try:
        stats = storico.genera_wrapped(target_user)

        stats_vuote = {
            "viaggi_totali": 0, "co2_risparmiata": 0,
            "km_totali": 0, "mezzo_preferito": "Nessuno"
        }

        dati_finali = stats if stats else stats_vuote

        # Restituisco i dati in un formato che il frontend Wrapped.js può leggere facilmente
        risposta = {
            "ok": True,
            "target": target_user,
            "dati": dati_finali 
        }
        
        return jsonify(risposta)

    except Exception as e:
        print(f"❌ Errore Wrapped: {e}")
        return jsonify({"ok": False, "errore": str(e)})


@app.route('/api/calcolo-alberi', methods=['POST'])
def api_calcolo_alberi():
    data = request.get_json() or {}
    co2_input = data.get('co2')
    
    if isinstance(co2_input, str):
        try:
            co2_input = co2_input.split(' ')[0]
        except:
            pass

    try:
        co2_valore = float(co2_input)
    except (ValueError, TypeError):
        return jsonify({"ok": False, "errore": "Valore CO2 non valido"}), 400

    giorni_necessari = alberiCO2(co2_valore)

    return jsonify({
        "ok": True,
        "co2_kg": co2_valore,
        "giorni_per_albero": giorni_necessari,
        "messaggio": f"Un albero impiegherebbe circa {giorni_necessari} giorni per assorbire questa CO₂."
    })

@app.route('/api/classifica', methods=['GET'])
def api_classifica():
    try:
        data = storico.get_classifica_risparmio()
        return jsonify({"ok": True, "classifica": data})
    except Exception as e:
        print(f"Errore classifica: {e}")
        return jsonify({"ok": False, "classifica": []})
    
if __name__ == '__main__':
    print("🚀 Server EcoRoute avviato...")
    app.run(host='0.0.0.0', port=5000, debug=True)