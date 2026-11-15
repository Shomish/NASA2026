#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Convierte el dataset Non-EEG (PhysioNet) al JSON del importador de AYNI HEALTH.

Uso:
  python -I scripts/datos-reales/noneeg.py \
    --entrada data/externos/noneeg-1.0.0.zip \
    --salida data/convertidos/noneeg.json

El dataset contiene personas sanas en la Tierra; no son astronautas.
"""
import argparse
import csv
import json
import os
import statistics
import zipfile

import wfdb

BASE = 'non-eeg-dataset-for-assessment-of-neurological-status-1.0.0'
FASES = {
    'Relax': 'relax',
    'PhysicalStress': 'physical-stress',
    'EmotionalStress': 'emotional-stress',
    'CognitiveStress': 'cognitive-stress',
}


def asegurar_extraccion(zip_path, destino):
    """Extrae el zip si aún no está extraído."""
    if not os.path.isdir(destino):
        with zipfile.ZipFile(zip_path) as z:
            z.extractall(destino)


def leer_subjectinfo(base):
    """Lee edad, sexo, talla y peso de subjectinfo.csv."""
    ruta = os.path.join(base, 'subjectinfo.csv')
    with open(ruta, encoding='utf-8', newline='') as f:
        return {int(fila['subject']): fila for fila in csv.DictReader(f)}


def media(lista):
    """Media redondeada a un decimal; devuelve None si no hay datos."""
    valores = [v for v in lista if v is not None]
    return round(statistics.fmean(valores), 1) if valores else None


def convertir(entrada, salida, sujetos_max=5):
    """Convierte los primeros sujetos del dataset a JSON."""
    extract = os.path.join(os.path.dirname(entrada), 'extract', 'noneeg')
    asegurar_extraccion(entrada, extract)
    base = os.path.join(extract, BASE)
    info = leer_subjectinfo(base)

    tripulacion = []
    registros = []
    for numero in range(1, sujetos_max + 1):
        nombre = f'PhysioNet NonEEG S{numero:02d}'
        spO2_path = os.path.join(base, f'Subject{numero}_SpO2HR')
        acc_path = os.path.join(base, f'Subject{numero}_AccTempEDA')
        if not os.path.exists(spO2_path + '.hea') or not os.path.exists(acc_path + '.hea'):
            continue

        datos = info.get(numero, {})
        sexo = datos.get('gender', '')
        tripulacion.append({
            'nombre': nombre,
            'cargo': 'Referencia PhysioNet Non-EEG',
            'edad': int(datos['age']) if datos.get('age') else None,
            'peso_kg': float(datos['weight/kg']) if datos.get('weight/kg') else None,
            'altura_cm': float(datos['height/cm']) if datos.get('height/cm') else None,
            'mision': 'Datos reales de referencia',
            'objetivo': f'Comparar signos vitales de referencia ({sexo})',
            'alergias': [],
            'entorno': 'Análogo terrestre Cusco',
            'origen': 'physionet-noneeg',
        })

        rec_spo2 = wfdb.rdrecord(spO2_path)
        rec_acc = wfdb.rdrecord(acc_path)
        ann = wfdb.rdann(acc_path, 'atr')
        fs_spo2 = float(rec_spo2.fs)
        fs_acc = float(rec_acc.fs)
        spo2 = rec_spo2.p_signal[:, 0]
        fc = rec_spo2.p_signal[:, 1]
        temp = rec_acc.p_signal[:, 3]

        # Agrupa los intervalos por fase.
        intervalos = {}
        for i, fase in enumerate(ann.aux_note):
            clave = FASES.get(str(fase).strip())
            if not clave:
                continue
            inicio = ann.sample[i] / fs_acc
            fin = ann.sample[i + 1] / fs_acc if i + 1 < len(ann.sample) else rec_acc.sig_len / fs_acc
            intervalos.setdefault(clave, []).append((inicio, fin))

        for clave, rangos in intervalos.items():
            valores_spo2 = []
            valores_fc = []
            valores_temp = []
            for inicio, fin in rangos:
                a = max(0, int(inicio * fs_spo2))
                b = max(a + 1, int(fin * fs_spo2))
                valores_spo2.extend(spo2[a:b].tolist())
                valores_fc.extend(fc[a:b].tolist())
                a2 = max(0, int(inicio * fs_acc))
                b2 = max(a2 + 1, int(fin * fs_acc))
                valores_temp.extend(temp[a2:b2].tolist())

            hora = int(round(rangos[0][0] // 3600)) % 24
            minuto = int(round((rangos[0][0] % 3600) // 60)) % 60
            registros.append({
                'tripulante': nombre,
                'tipo': 'signos_vitales',
                'fecha_registro': f'2019-01-01T{hora:02d}:{minuto:02d}:00.000Z',
                'origen': f'physionet-noneeg/{clave}',
                'detalle': {
                    'frecuencia_cardiaca': int(round(media(valores_fc))) if media(valores_fc) is not None else None,
                    'spo2': media(valores_spo2),
                    'temperatura_piel_c': media(valores_temp),
                    'masa_kg': float(datos['weight/kg']) if datos.get('weight/kg') else None,
                },
            })

    os.makedirs(os.path.dirname(salida), exist_ok=True)
    with open(salida, 'w', encoding='utf-8') as f:
        json.dump({'tripulacion': tripulacion, 'registros': registros}, f, ensure_ascii=False, indent=2)

    print(f'Tripulantes: {len(tripulacion)} · Registros: {len(registros)}')
    print(f'Salida: {salida}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--entrada', default='data/externos/noneeg-1.0.0.zip')
    parser.add_argument('--salida', default='data/convertidos/noneeg.json')
    args = parser.parse_args()
    convertir(args.entrada, args.salida)
