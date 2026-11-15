#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Convierte MMASH (PhysioNet) al JSON del importador de AYNI HEALTH.

Uso:
  python -I scripts/datos-reales/mmash.py \
    --entrada data/externos/extract/mmash/multilevel-monitoring-of-activity-and-sleep-in-healthy-people-1.0.0/MMASH.zip \
    --salida data/convertidos/mmash.json

Se toma una noche por sujeto. El sujeto 11 no tiene datos de sueño.
"""
import argparse
import json
import os
import zipfile

import pandas as pd


def convertir(entrada, salida):
    """Convierte una noche por sujeto."""
    tripulacion = []
    registros = []

    with zipfile.ZipFile(entrada) as z:
        for numero in range(1, 23):
            base = f'DataPaper/user_{numero}'
            try:
                info = pd.read_csv(z.open(f'{base}/user_info.csv'))
            except KeyError:
                continue
            fila_info = info.iloc[0] if len(info) else {}
            nombre = f'PhysioNet MMASH U{numero:02d}'
            tripulacion.append({
                'nombre': nombre,
                'cargo': 'Referencia MMASH',
                'edad': int(fila_info['Age']) if pd.notna(fila_info.get('Age')) else None,
                'peso_kg': float(fila_info['Weight']) if pd.notna(fila_info.get('Weight')) else None,
                'altura_cm': float(fila_info['Height']) if pd.notna(fila_info.get('Height')) else None,
                'mision': 'Datos reales de referencia',
                'objetivo': 'Sueño de referencia',
                'alergias': [],
                'entorno': 'Análogo terrestre Cusco',
                'origen': 'physionet-mmash',
            })

            try:
                sueno = pd.read_csv(z.open(f'{base}/sleep.csv'))
            except KeyError:
                continue
            if sueno.empty:
                print(f'Aviso: {nombre} no tiene datos de sueño; se omite el registro.')
                continue

            fila = sueno.iloc[0]
            tst = float(fila['Total Sleep Time (TST)'])
            eficiencia = float(fila['Efficiency'])
            despertares = int(fila['Number of Awakenings'])
            dia = int(fila['In Bed Date'])
            hora = str(fila['In Bed Time'])
            registros.append({
                'tripulante': nombre,
                'tipo': 'sueno',
                'fecha_registro': f'2020-01-{dia:02d}T{hora}:00.000Z',
                'origen': f'physionet-mmash/U{numero:02d}',
                'detalle': {
                    'horas': round(tst / 60, 1),
                    'calidad': max(0, min(10, int(round(eficiencia / 10)))),
                    'despertares': despertares,
                },
            })

    os.makedirs(os.path.dirname(salida), exist_ok=True)
    with open(salida, 'w', encoding='utf-8') as f:
        json.dump({'tripulacion': tripulacion, 'registros': registros}, f, ensure_ascii=False, indent=2)

    print(f'Tripulantes: {len(tripulacion)} · Registros: {len(registros)}')
    print(f'Salida: {salida}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--entrada', default='data/externos/extract/mmash/multilevel-monitoring-of-activity-and-sleep-in-healthy-people-1.0.0/MMASH.zip')
    parser.add_argument('--salida', default='data/convertidos/mmash.json')
    args = parser.parse_args()
    convertir(args.entrada, args.salida)
