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

def traduci_errore_aws(error):
    if not hasattr(error, 'response'): return str(error)
    code = error.response['Error']['Code']
    msg = error.response['Error']['Message']
    
    if code == 'InvalidParameterException':
        if "password" in msg.lower():
            return "Password troppo debole: usa 8 caratteri."
        return "Parametri non validi."
    elif code == 'UsernameExistsException':
        return "Questo username è già in uso."
    elif code == 'LimitExceededException':
        return "Troppi tentativi. Riprova più tardi."
    else:
        return f"Errore: {msg}"

# --- MODIFICA SOLO QUI ---
def register_user(username, password, regione, email):
    if not client: return False, "Errore server: Credenziali AWS mancanti."
    try:
        secret_hash = get_secret_hash(username)
        
        # 1. Creiamo l'utente su Cognito
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
        
        # 2. Conferma FORZATA (Bypassa invio mail e codice)
        # Questo comando richiede che le chiavi AWS su Render abbiano permessi Admin/PowerUser
        client.admin_confirm_sign_up(
            UserPoolId=USER_POOL_ID,
            Username=username
        )
        
        # 3. Messaggio speciale per dire al frontend di saltare il codice
        return True, "REGISTRAZIONE_COMPLETA"

    except ClientError as e:
        return False, traduci_errore_aws(e)
    except Exception as e:
        return False, str(e)
# -------------------------

def verify_user(username, code):
    # Non serve più, ma la lasciamo per non rompere app.py
    return True, "Account verificato."

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