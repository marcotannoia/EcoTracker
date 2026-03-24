import boto3
import os
from dotenv import load_dotenv

# Carica le credenziali dal file .env
load_dotenv()

REGION = "eu-south-1" # Milano (vicino a te a Bari, latenza minima!)
BUCKET_NAME = os.getenv("AWS_S3_BUCKET_NAME")
TABLE_NAME = os.getenv("AWS_DYNAMODB_TABLE")

# Inizializza i client AWS
s3_client = boto3.client('s3', region_name=REGION)
dynamodb_client = boto3.client('dynamodb', region_name=REGION)

def crea_bucket_s3():
    print(f"📦 Creazione Bucket S3: {BUCKET_NAME}...")
    try:
        s3_client.create_bucket(
            Bucket=BUCKET_NAME,
            CreateBucketConfiguration={'LocationConstraint': REGION}
        )
        print("✅ Bucket S3 creato con successo!")
    except Exception as e:
        print(f"⚠️ Attenzione S3: {e}")

def crea_tabella_dynamodb():
    print(f"🗄️ Creazione Tabella DynamoDB: {TABLE_NAME}...")
    try:
        dynamodb_client.create_table(
            TableName=TABLE_NAME,
            KeySchema=[
                {'AttributeName': 'user_id', 'KeyType': 'HASH'},  # Partition Key
                {'AttributeName': 'doc_id', 'KeyType': 'RANGE'}   # Sort Key
            ],
            AttributeDefinitions=[
                {'AttributeName': 'user_id', 'AttributeType': 'S'},
                {'AttributeName': 'doc_id', 'AttributeType': 'S'},
                {'AttributeName': 'sha256', 'AttributeType': 'S'} # Serve per l'indice anti-doppione
            ],
            # Creiamo l'Indice Secondario per cercare velocemente gli hash
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'Sha256Index',
                    'KeySchema': [{'AttributeName': 'sha256', 'KeyType': 'HASH'}],
                    'Projection': {'ProjectionType': 'ALL'},
                    'ProvisionedThroughput': {'ReadCapacityUnits': 1, 'WriteCapacityUnits': 1}
                }
            ],
            ProvisionedThroughput={'ReadCapacityUnits': 1, 'WriteCapacityUnits': 1} # Limiti Free Tier
        )
        print("✅ Tabella DynamoDB in creazione... (ci vorrà circa 1 minuto sul cloud)")
    except Exception as e:
        print(f"⚠️ Attenzione DynamoDB: {e}")

if __name__ == "__main__":
    print("🚀 Inizio Setup Infrastruttura AWS EcoTracker...")
    crea_bucket_s3()
    crea_tabella_dynamodb()
    print("🎉 Setup completato!")