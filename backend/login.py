import boto3
import os
import hmac
import hashlib
import base64
from botocore.exceptions import ClientError
from dotenv import load_dotenv

load_dotenv()

REGION_NAME = os.getenv("AWS_REGION")
USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID")
CLIENT_ID = os.getenv("COGNITO_CLIENT_ID")
CLIENT_SECRET = os.getenv("COGNITO_CLIENT_SECRET")

# Inizializzazione sicura
try:
    client = boto3.client('cognito-idp', region_name=REGION_NAME)
except Exception as e:
    print(f"ERRORE BOTO3: {e}")
    client = None

def get_secret_hash(username):
    if not CLIENT_SECRET or not CLIENT_ID: return None
    msg = username + CLIENT_ID
    dig = hmac.new(
        str(CLIENT_SECRET).encode('utf-8'), 
        msg=str(msg).encode('utf-8'), 
        digestmod=hashlib.sha256
    ).digest()
    return base64.b64encode(dig).decode()

# --- FUNZIONE NUOVA: Controlla se la mail esiste già ---
def controlla_email_esistente(email):
    if not client or not USER_POOL_ID: return False
    try:
        # Chiediamo a Cognito: dammi la lista di utenti che hanno questa email
        response = client.list_users(
            UserPoolId=USER_POOL_ID,
            Filter=f'email = "{email}"'
        )
        # Se la lista non è vuota, vuol dire che l'email esiste già
        return len(response['Users']) > 0
    except Exception as e:
        print(f"Errore controllo email: {e}")
        return False

# --- IL TRADUTTORE ---
def traduci_errore_aws(error):
    if not hasattr(error, 'response'): return str(error)
    
    code = error.response['Error']['Code']
    msg = error.response['Error']['Message']
    
    if code == 'InvalidParameterException':
        if "password" in msg.lower(): 
            return "Password debole: usa almeno 8 caratteri, un numero e un simbolo."
        if "email" in msg.lower():
            return "Formato email non valido."
            
    elif code == 'UsernameExistsException':
        return "Username già in uso. Scegline un altro."
        
    elif code == 'UserNotFoundException':
        return "Utente non trovato."
        
    elif code == 'NotAuthorizedException':
        return "Password errata o account non confermato."
        
    elif code == 'CodeMismatchException':
        return "Codice errato."
        
    elif code == 'ExpiredCodeException':
        return "Codice scaduto. Richiedine uno nuovo."
    
    elif code == 'LimitExceededException':
        return "Troppi tentativi. Riprova più tardi."
        
    return f"Errore: {msg}"

# --- FUNZIONI DI AUTH ---

def register_user(username, password, regione, email):
    if not client: return False, "Errore server: Credenziali AWS mancanti."
    
    # 1. PRIMA DI TUTTO: Controlliamo se la mail è già presa
    if controlla_email_esistente(email):
        return False, "Questa email è già associata a un altro account."

    try:
        secret_hash = get_secret_hash(username)
        client.sign_up(
            ClientId=CLIENT_ID,
            SecretHash=secret_hash,
            Username=username,
            Password=password,
            UserAttributes=[
                {'Name': 'custom:regione', 'Value': regione},
                {'Name': 'email', 'Value': email}
            ]
        )
        return True, "Codice inviato alla mail"
    except ClientError as e:
        return False, traduci_errore_aws(e)
    except Exception as e:
        return False, str(e)

def verify_user(username, code):
    if not client: return False, "Errore server."
    try:
        secret_hash = get_secret_hash(username)
        client.confirm_sign_up(
            ClientId=CLIENT_ID,
            SecretHash=secret_hash,
            Username=username,
            ConfirmationCode=code
        )
        return True, "Account verificato!"
    except ClientError as e:
        return False, traduci_errore_aws(e)
    except Exception as e:
        return False, str(e)

def login_user(username, password):
    if not client: return None
    try:
        secret_hash = get_secret_hash(username)
        resp = client.initiate_auth(
            ClientId=CLIENT_ID,
            AuthFlow='USER_PASSWORD_AUTH',
            AuthParameters={
                'USERNAME': username,
                'PASSWORD': password,
                'SECRET_HASH': secret_hash
            }
        )
        access_token = resp['AuthenticationResult']['AccessToken']
        user_info = client.get_user(AccessToken=access_token)
        
        regione = ""
        for attr in user_info['UserAttributes']:
            if attr['Name'] == 'custom:regione':
                regione = attr['Value']

        return {"username": username, "regione": regione, "role": "utente"}
    except ClientError:
        return None
    except Exception:
        return None

def get_users_list():
    if not client: return []
    try:
        response = client.list_users(
            UserPoolId=USER_POOL_ID,
            AttributesToGet=['custom:regione']
        )
        lista = []
        for u in response['Users']:
            reg = next((a['Value'] for a in u['Attributes'] if a['Name'] == 'custom:regione'), "")
            lista.append({"username": u['Username'], "regione": reg.lower()})
        return lista
    except Exception:
        return []