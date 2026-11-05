"""Create an original 260ms ascending coin sparkle (no sampled third-party audio)."""
import math
from pathlib import Path
import struct
import wave

RATE = 44100
DURATION = 0.26
samples = []
for i in range(round(RATE * DURATION)):
    t = i / RATE
    value = 0.0
    for start, freq, gain, decay in [(0.0, 1318.51, 0.62, 0.043), (0.065, 1975.53, 0.54, 0.060), (0.100, 2637.02, 0.12, 0.045)]:
        age = t - start
        if age < 0:
            continue
        attack = min(1.0, age / 0.0018)
        envelope = attack * math.exp(-age / decay)
        phase = 2 * math.pi * freq * (age + 0.00035 * (1 - math.exp(-age / 0.008)))
        # A very quiet inharmonic overtone gives a metallic coin edge.
        value += gain * envelope * (math.sin(phase) + 0.12 * math.sin(phase * 2.73) * math.exp(-age / 0.022))
    tail = min(1.0, max(0.0, (DURATION - t) / 0.025))
    value *= 0.5 - 0.5 * math.cos(math.pi * tail)
    samples.append(value)
peak = max(abs(v) for v in samples)
path = Path('public/assets/sfx/coin.wav')
path.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(path), 'wb') as file:
    file.setparams((1, 2, RATE, 0, 'NONE', 'not compressed'))
    file.writeframes(b''.join(struct.pack('<h', round(v / peak * 0.65 * 32767)) for v in samples))
print(f'{path}: {DURATION}s, {RATE}Hz, mono, peak -3.7dBFS')
