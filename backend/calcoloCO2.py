def calcoloCO2(distanza_km, mezzo):
    emissioni_per_km = { # valori medi di co2 in kg per km
        'car': 0.160,        
        'public_bus': 0.170, 
        'bike': 0.0,         
        'piedi': 0.0,
        'veicolo_elettrico': 0.0
    }
    
    if mezzo not in emissioni_per_km:
        mezzo = 'car' 
    
    if mezzo in ['bike', 'piedi', 'veicolo_elettrico']:
        return (" Bravo! Nessuna emissione di CO2 per questo mezzo.")
    elif mezzo in ['public_bus']: 
        return("Le emissioni vengono divise tra i passeggeri nel trasporto pubblico! Bravo!")
    kg_co2 = distanza_km * emissioni_per_km[mezzo] # algoritmo di calcolo
    return round(kg_co2, 3) 