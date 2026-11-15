#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Convierte una muestra del dataset BIG IDEAs Lab (PhysioNet) al JSON del importador.

Uso:
  python -I scripts/datos-reales/bigideas.py \
    --entrada data/externos \
    --salida data/convertidos/bigideas.json

Requiere los archivos Demographics.csv y 001/Dexcom_001.csv ... 003/Dexcom_003.csv
del dataset big-ideas-glycemic-wearable-1.1.2. El zip completo pesa ~5 GB.
"""
import argparse
import json
import os

import pandas as pd

SUJETOS = [1, 2, 3]


def convertir(entrada, salida):
    """Convierte los primeros sujetos a registros diarios de glucosa."""
    demografia = pd.read_csv(os.path.join(entrada, 'bigideas_Demographics.csv'))
    tripulacion = []
    registros = []

    for numero in SUJETOS:
        nombre = f'PhysioNet BIG IDEAs S{numero:02d}'
        fila = demografia[demografia['ID'] == numero]
        hba1c = float(fila['HbA1c'].iloc[0]) if len(fila) and pd.notna(fila['HbA1c'].iloc[0]) else None
        genero = str(fila['Gender'].iloc[0]) if len(fila) else ''
        tripulacion.append({
            'nombre': nombre,
            'cargo': 'Referencia BIG IDEAs',
            'mision': 'Datos reales de referencia',
            'objetivo': f'Glucosa continua de referencia ({genero}; HbA1c {hba1c}%)' if hba1c else f'Glucosa continua de referencia ({genero})',
            'alergias': [],
            'entorno': 'Análogo terrestre Cusco',
            'origen': 'physionet-bigideas',
        })

        ruta = os.path.join(entrada, f'bigideas_{numero:03d}_Dexcom_{numero:03d}.csv')
        if not os.path.exists(ruta):
            print(f'Aviso: no se encontró {ruta}; se omite {nombre}.')
            continue

        df = pd.read_csv(ruta, low_memory=False)
        egv = df[df['Event Type'].astype(str).str.upper().eq('EGV')].copy()
        egv['fecha'] = pd.to_datetime(egv['Timestamp (YYYY-MM-DDThh:mm:ss)'], errors='coerce')
        egv['glucosa'] = pd.to_numeric(egv['Glucose Value (mg/dL)'], errors='coerce')
        egv = egv.dropna(subset=['fecha', 'glucosa'])
        if egv.empty:
            print(f'Aviso: sin lecturas EGV para {nombre}.')
            continue

        diario = egv.groupby(egv['fecha'].dt.date)['glucosa'].agg(['min', 'count'])
        for fecha, fila_dia in diario.iterrows():
            if int(fila_dia['count']) < 3:
                continue
            registros.append({
                'tripulante': nombre,
                'tipo': 'glucosa',
                'fecha_registro': f'{fecha.isoformat()}T12:00:00.000Z',
                'origen': f'physionet-bigideas/S{numero:02d}',
                'detalle': {
                    'glucosa_mgdl': int(round(fila_dia['min'])),
                    'ayunas': False,
                },
            })

    os.makedirs(os.path.dirname(salida), exist_ok=True)
    with open(salida, 'w', encoding='utf-8') as f:
        json.dump({'tripulacion': tripulacion, 'registros': registros}, f, ensure_ascii=False, indent=2)

    print(f'Tripulantes: {len(tripulacion)} · Registros: {len(registros)}')
    print(f'Salida: {salida}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--entrada', default='data/externos')
    parser.add_argument('--salida', default='data/convertidos/bigideas.json')
    args = parser.parse_args()
    convertir(args.entrada, args.salida)
