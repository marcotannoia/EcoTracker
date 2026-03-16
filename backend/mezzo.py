def opzione_trasporto():
# va be quindi definisco i mezzi
    
    options = [
        {
            "id": "piedi",
            "label": "A piedi",
            "icon": "🚶",
            "color": "bg-green-500", 
            "action_url": "/api/v1/walking"
        },
        {
            "id": "bike",
            "label": "Bicicletta",
            "icon": "🚲",
            "color": "bg-blue-500",
            "action_url": "/api/v1/bike"
        },
        {
            "id": "car",
            "label": "Auto",
            "icon": "🚗",
            "color": "bg-red-500",
            "action_url": "/api/v1/car"
        },
        {
            "id": "public_bus",
            "label": "Bus",
            "icon": "🚌",
            "color": "bg-orange-500",
            "action_url": "/api/v1/bus"
        },
    {       "id": "veicolo_elettrico",
             "label": "Veicolo Elettrico",
            "icon": "🔋",
            "color": "bg-yellow-500",
            "action_url": "/api/v1/electric_vehicle"
        },
    ]
    
    return options