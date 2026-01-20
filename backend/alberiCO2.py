def alberiCO2(co2_emessa): 
    assorbimento_medio_giornaliero = 0.060
    tempo_assorbimento = co2_emessa / assorbimento_medio_giornaliero
    return round(tempo_assorbimento, 2)

# con sta funzione mi calcolo approssimativamente quanto assorbe un piccolo ingenuo alberos
# licia e daniele dopo 12 ore di codice il 24 di dicembre ho ifnito sto progetto 
# quando clonerete la repo sara il 2026 quindi vi auguro buon anno cari miei compagni di vita