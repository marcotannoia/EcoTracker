from flask import Flask, jsonify, request, session
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix # NECESSARIO per Render
import maps
import calcoloCO2
from mezzo import opzione_trasporto
import login as auth_service 
import storico
from alberiCO2 import alberiCO2
import os

app = Flask(__name__)

# --- 1. CONFIGURAZIONE SICUREZZA PER RENDER ---
# Dice a Flask che siamo dietro un proxy HTTPS (Render)
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Chiave segreta (prende quella di Render o usa quella di default per locale)
app.secret_key = os.environ.get("SECRET_KEY", "chiave-segreta-super-sicura")

# Impostazioni Cookie per farli viaggiare tra CloudFront e Render
app.config['SESSION_COOKIE_SAMESITE'] = 'None' 
app.config['SESSION_COOKIE_SECURE'] = True      
app.config['SESSION_COOKIE_HTTPONLY'] = True    

# --- 2. CORS (PERMETTE A CLOUDFRONT DI ACCEDERE) ---
# Sostituisci l'URL se cambia, ma questo è quello del tuo screenshot
CORS(app, origins=["https://dgyjenq1r43lo.cloudfront.net"], supports_credentials=True)

# --- ROTTE ---

# Autenticazione
@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json() or {}
    user = auth_service.login_user(data.get('username'), data.get('password'))
    
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
    username = data.get('username')
    password = data.get('password')
    regione = data.get('regione')
    email = data.get('email')
    
    ok, msg = auth_service.register_user(username, password, regione, email)
    return jsonify({"ok": ok, "messaggio": msg}), 201 if ok else 409

@app.route('/api/conferma', methods=['POST'])
def api_conferma():
    data = request.get_json() or {}
    username = data.get('username')
    codice = data.get('codice')
    
    ok, msg = auth_service.verify_user(username, codice)
    return jsonify({"ok": ok, "messaggio": msg}), 200 if ok else 400

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
            "regione": session.get('regione', '')
        })
    return jsonify({"ok": False}), 401

@app.route('/api/utenti', methods=['GET'])
def get_utenti():
    try:
        lista = auth_service.get_users_list()
        return jsonify({"ok": True, "utenti": lista})
    except Exception as e:
        print(f"Errore utenti: {e}")
        return jsonify({"ok": False, "utenti": []})

# Veicoli 
@app.route('/api/veicoli', methods=['GET'])
def vehicles():
    return jsonify(opzione_trasporto()) 

# --- ROTTA CRITICA: NAVIGAZIONE E SALVATAGGIO ---
@app.route('/api/navigazione', methods=['POST'])
def navigazione():
    data = request.get_json() or {} 
    start, end = data.get('start'), data.get('end')
    mezzo = data.get('mezzo', 'car')

    if not start or not end:
        return jsonify({"ok": False, "errore": "Indirizzi mancanti"}), 400
    
    # Calcolo percorso
    route = maps.get_google_distance(start, end)  
    
    if not route:
        return jsonify({"ok": False, "errore": "Percorso non trovato (Verifica API Key Google)"}), 400

    distanza_km = route.get('distanza_valore', 0) / 1000.0

    if mezzo in ['bike', 'piedi', 'veicolo_elettrico']:
        emissioni = 0
    else:
        emissioni = calcoloCO2.calcoloCO2(distanza_km, mezzo)

    # --- BLOCCO SALVATAGGIO CON DEBUG ---
    current_username = session.get('username') 
    
    if current_username:
        print(f"🔄 Tentativo salvataggio viaggio per: {current_username}...")
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
                print("✅ Viaggio salvato correttamente nel DB.")
            else:
                print("❌ ERRORE DB: storico.registra_viaggio ha restituito False.")
        except Exception as e:
             print(f"❌ ERRORE GRAVE DURANTE IL SALVATAGGIO: {e}")
    else:
        print("⚠️ Utente non loggato, viaggio non salvato.")
    # ------------------------------------
    
    map_url = maps.get_embed_map_url(route.get('start_address'), route.get('end_address'))

    return jsonify({
        "ok": True,
        "start_address": route.get('start_address'),
        "end_address": route.get('end_address'),
        "distanza_testo": route.get('distanza_testo'),
        "emissioni_co2": f"{emissioni:.2f} kg di CO₂" if isinstance(emissioni, (int, float)) else str(emissioni),
        "mezzo_scelto": mezzo,
        "is_logged": bool(current_username),
        "map_url": map_url
    })

# Storico e Statistiche
@app.route('/api/storico', methods=['GET'])
def api_storico_completo():
    current_username = session.get('username')
    if not current_username:
        return jsonify({"ok": False, "errore": "Non loggato"}), 401
    dati = storico.get_storico_completo(current_username)
    return jsonify(dati) 

@app.route('/api/wrapped', defaults={'username': None}, methods=['GET'])
@app.route('/api/wrapped/<username>', methods=['GET'])
def api_wrapped(username):
    current_username = session.get('username')
    target_user = username if username else current_username
    
    if not target_user:
        return jsonify({"ok": False, "errore": "Utente non specificato."}), 401 
    
    stats = storico.genera_wrapped(target_user)

    if stats is None:
        return jsonify({"ok": False, "messaggio": f"Nessun dato per {target_user}"}), 404 

    return jsonify({"ok": True, "dati": stats, "target": target_user})

@app.route('/api/calcolo-alberi', methods=['POST'])
def api_calcolo_alberi():
    data = request.get_json() or {}
    co2_input = data.get('co2')
    
    if co2_input is None:
        return jsonify({"ok": False, "errore": "Valore CO2 mancante"}), 400
    
    try:
        co2_valore = float(co2_input)
    except ValueError:
        return jsonify({"ok": False, "errore": "Il valore deve essere numerico"}), 400

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
    print("Server EcoRoute in esecuzione...")
    app.run(host='0.0.0.0', port=5000, debug=True)