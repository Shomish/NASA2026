#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Convierte una muestra de NHANES 2021–2023 al JSON del importador de AYNI HEALTH.

Uso:
  python -I scripts/datos-reales/nhanes.py \
    --entrada data/externos \
    --salida data/convertidos/nhanes.json

- BPXO_L: primera lectura válida de presión arterial.
- DPQ_L: se descartan respuestas 7 (se negó) y 9 (no sabe); se exigen los 9 ítems válidos.
- GLU_L: glucosa en ayunas.
Se eligen 2 personas con datos válidos y se identifican como referencia, no como astronautas.
"""
import argparse
import json
import os

import numpy as np
import pandas as pd

COLUMNAS_PHQ = [f'DPQ0{i}0' for i in range(1, 10)]


def numero(valor):
    """Convierte un valor XPT a número positivo o None (descarta missing)."""
    try:
        v = float(valor)
        return v if np.isfinite(v) and v > 0 else None
    except (TypeError, ValueError):
        return None


def nivel_phq9(puntaje):
    """Interpretación PHQ-9 (Kroenke et al., 2001)."""
    if puntaje <= 4:
        return 'mínima'
    if puntaje <= 9:
        return 'leve'
    if puntaje <= 14:
        return 'moderada'
    if puntaje <= 19:
        return 'moderadamente severa'
    return 'severa'


def convertir(entrada, salida):
    """Selecciona dos personas con BP, PHQ-9 y glucosa válidos."""
    bp = pd.read_sas(os.path.join(entrada, 'BPXO_L.xpt'), format='xport')
    dpq = pd.read_sas(os.path.join(entrada, 'DPQ_L.xpt'), format='xport')
    glu = pd.read_sas(os.path.join(entrada, 'GLU_L.xpt'), format='xport')

    bp['sy'] = bp['BPXOSY1'].apply(numero)
    bp['di'] = bp['BPXODI1'].apply(numero)
    bp['pulse'] = bp['BPXOPLS1'].apply(numero)
    bp = bp[bp['sy'].notna() & bp['di'].notna() & (bp['sy'] < 300) & (bp['di'] < 200)]

    def phq_valido(fila):
        return all(pd.notna(fila[c]) and float(fila[c]) in (0, 1, 2, 3) for c in COLUMNAS_PHQ)

    dpq['valido'] = dpq.apply(phq_valido, axis=1)
    dpq = dpq[dpq['valido']]

    glu['g'] = glu['LBXGLU'].apply(numero)
    glu = glu[glu['g'].notna()]

    comunes = sorted(set(bp['SEQN'].astype(int)) & set(dpq['SEQN'].astype(int)) & set(glu['SEQN'].astype(int)))
    if not comunes:
        raise SystemExit('No hay personas con BPXO_L, DPQ_L y GLU_L válidos en el ciclo.')

    # Elegir una persona con presión alta y otra con glucosa elevada en ayunas.
    elegidos = []
    for seqn in comunes:
        fila_bp = bp[bp['SEQN'].astype(int) == seqn].iloc[0]
        if (fila_bp['sy'] >= 140 or fila_bp['di'] >= 90) and seqn not in elegidos:
            elegidos.append(seqn)
            break
    for seqn in comunes:
        if seqn in elegidos:
            continue
        fila_glu = glu[glu['SEQN'].astype(int) == seqn].iloc[0]
        if 100 <= fila_glu['g'] <= 125:
            elegidos.append(seqn)
            break
    for seqn in comunes:
        if len(elegidos) >= 2:
            break
        if seqn not in elegidos:
            elegidos.append(seqn)

    tripulacion = []
    registros = []
    for indice, seqn in enumerate(elegidos[:2]):
        nombre = f'NHANES SEQN {seqn}'
        fila_bp = bp[bp['SEQN'].astype(int) == seqn].iloc[0]
        fila_phq = dpq[dpq['SEQN'].astype(int) == seqn].iloc[0]
        fila_glu = glu[glu['SEQN'].astype(int) == seqn].iloc[0]
        respuestas = [int(fila_phq[c]) for c in COLUMNAS_PHQ]
        puntaje = sum(respuestas)

        tripulacion.append({
            'nombre': nombre,
            'cargo': 'Referencia NHANES',
            'mision': 'Datos reales de referencia',
            'objetivo': 'Presión, PHQ-9 y glucosa de referencia (NHANES)',
            'alergias': [],
            'entorno': 'Análogo terrestre Cusco',
            'origen': 'nhanes',
        })

        registros.append({
            'tripulante': nombre,
            'tipo': 'signos_vitales',
            'fecha_registro': f'2022-01-{1 + indice * 2:02d}T09:00:00.000Z',
            'origen': 'nhanes/BPXO_L',
            'detalle': {
                'presion_sistolica': int(fila_bp['sy']),
                'presion_diastolica': int(fila_bp['di']),
                'frecuencia_cardiaca': int(fila_bp['pulse']) if pd.notna(fila_bp['pulse']) else None,
            },
        })
        registros.append({
            'tripulante': nombre,
            'tipo': 'salud_mental',
            'fecha_registro': f'2022-01-{2 + indice * 2:02d}T09:00:00.000Z',
            'origen': 'nhanes/DPQ_L',
            'detalle': {
                'respuestas': respuestas,
                'puntaje': puntaje,
                'nivel': nivel_phq9(puntaje),
                'item9_positivo': respuestas[8] > 0,
            },
        })
        registros.append({
            'tripulante': nombre,
            'tipo': 'glucosa',
            'fecha_registro': f'2022-01-{3 + indice * 2:02d}T09:00:00.000Z',
            'origen': 'nhanes/GLU_L',
            'detalle': {
                'glucosa_mgdl': int(fila_glu['g']),
                'ayunas': True,
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
    parser.add_argument('--salida', default='data/convertidos/nhanes.json')
    args = parser.parse_args()
    convertir(args.entrada, args.salida)
