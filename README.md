# 🌱 EcoTrack

## 🌍 Descrizione
EcoTrack è una piattaforma web integrata nata per colmare il divario tra la comunicazione dei dati ambientali e la consapevolezza dei cittadini. L'applicazione calcola l'impronta carbonica derivante dai propri spostamenti e la rapporta alla capacità di assorbimento naturale di un singolo albero, rendendo immediatamente percepibile l'entità del danno o del risparmio ambientale.

## 🚀 Core Features
* **Calcolo Percorsi e CO2:** Permette di inserire luogo di partenza, arrivo e scegliere il mezzo utilizzato. Calcola la distanza tramite le API di Google Maps e restituisce una stima in tempo reale della CO2 emessa.
* **Gamification & Leaderboard:** Sistema di classifica globale ("ECOSAVERS") che incentiva la riduzione delle emissioni tramite una competizione sana tra gli utenti.
* **EcoTrack Monthly Wrap:** Report di riepilogo mensile con statistiche dettagliate su chilometri percorsi, mezzi di trasporto più utilizzati e bilancio della CO2 emessa/risparmiata.
* **UI Reattiva e Personalizzabile:** Interfaccia minimale con navigazione tramite "Dock" e supporto nativo alla Dark Mode per migliorare il comfort visivo.

## 🛠️ Tech Stack
* **Frontend:** Sviluppato in React (Single Page Application).
* **Backend:** Sviluppato in Python utilizzando il micro-framework Flask.
* **Infrastruttura:** Containerizzazione dell'intera architettura tramite Docker e Docker Compose.

## ⚙️ Setup & Esecuzione (Locale)
L'intero progetto è containerizzato per eliminare il problema dell'eterogeneità delle configurazioni software.

1. Clona la repository:
```bash
git clone [https://github.com/tuo-username/EcoTrack.git](https://github.com/tuo-username/EcoTrack.git)
cd EcoTrack
```
2. Crea il file .env nella cartella di configurazione (escluso da git grazie al .gitignore) e inserisci le variabili d'ambiente:
```
GOOGLE_API_KEY=inserisci_la_tua_chiave_qui
```
3. Avvia i servizi
```bash
docker-compose up --build
```
## 👥 Autori ##
Progetto di Ingegneria del Software - Politecnico di Bari.

Marco Tannoia

Licia Pia Zichella

Daniele Pio Oscuri
