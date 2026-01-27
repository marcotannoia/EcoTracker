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

client = boto3.client('cognito-idp', region_name=REGION_NAME)

def get_secret_hash(username):
    msg = username + CLIENT_ID
    dig = hmac.new(
        str(CLIENT_SECRET).encode('utf-8'), 
        msg=str(msg).encode('utf-8'), 
        digestmod=hashlib.sha256
    ).digest()
    return base64.b64encode(dig).decode()

# --- NUOVA FUNZIONE PER TRADURRE GLI ERRORI IN ITALIANO ---
def traduci_errore_aws(error):
    code = error.response['Error']['Code']
    msg = error.response['Error']['Message']
    
    if code == 'NotAuthorizedException':
        return "Password errata o account non confermato."
    elif code == 'UserNotFoundException':
        return "Utente non trovato. Controlla lo username."
    elif code == 'UsernameExistsException':
        return "Questo username è già in uso. Scegline un altro."
    elif code == 'CodeMismatchException':
        return "Codice di verifica errato. Riprova."
    elif code == 'ExpiredCodeException':
        return "Il codice è scaduto. Richiedine uno nuovo."
    elif code == 'LimitExceededException':
        return "Troppi tentativi falliti. Riprova più tardi."
    elif code == 'InvalidParameterException':
        # Spesso capita se la password è troppo corta o l'email è scritta male
        if "password" in msg.lower():
            return "Password troppo debole (usa almeno 8 caratteri, numeri e simboli)."
        return "Formato email o username non valido."
    else:
        # Fallback per errori sconosciuti
        return f"Errore: {msg}"

def register_user(username, password, regione, email):
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
        # Usiamo la traduzione qui
        return False, traduci_errore_aws(e)

def verify_user(username, code):
    """
    Verifica il codice ricevuto via email
    """
    try:
        secret_hash = get_secret_hash(username)
        client.confirm_sign_up(
            ClientId=CLIENT_ID,
            SecretHash=secret_hash,
            Username=username,
            ConfirmationCode=code
        )
        return True, "Account verificato con successo!"
    except ClientError as e:
        return False, traduci_errore_aws(e)

def login_user(username, password):
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
    except ClientError as e:
        print(f"Login error: {e}")
        # Qui ritorniamo None, ma potremmo gestire l'errore meglio nel router Flask chiamante
        # Tuttavia, per mantenere la struttura attuale, stampiamo l'errore
        # Nel tuo app.py dovresti catturare questo e usare traduci_errore_aws se possibile, 
        # oppure login_user dovrebbe ritornare (None, errore).
        # Per ora lascio che ritorni None come prima, ma gestiamo la logica nel Login API (vedi nota sotto)
        return None

def get_users_list():
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