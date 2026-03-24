def alberiCO2(co2_emessa): 
    assorbimento_medio_giornaliero = 0.060
    tempo_assorbimento = co2_emessa / assorbimento_medio_giornaliero
    return round(tempo_assorbimento, 2)

