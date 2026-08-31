from typing import List, Tuple


def detect_silence_ranges(audio_path: str, threshold_db: float, min_silence_ms: int) -> List[Tuple[float, float]]:
    try:
        import numpy as np
        import soundfile as sf
    except Exception as exc:
        raise RuntimeError("Sessizlik analizi için numpy ve soundfile gerekli.") from exc

    data, sample_rate = sf.read(audio_path, always_2d=False)
    if getattr(data, "ndim", 1) > 1:
        data = data.mean(axis=1)

    window = max(1, int(sample_rate * 0.05))
    min_windows = max(1, int((min_silence_ms / 1000) / 0.05))
    silent: list[bool] = []

    for start in range(0, len(data), window):
        chunk = data[start:start + window]
        if len(chunk) == 0:
            continue
        rms = float(np.sqrt(np.mean(chunk.astype("float64") ** 2)))
        db = 20 * np.log10(rms + 1e-9)
        silent.append(db <= threshold_db)

    ranges: List[Tuple[float, float]] = []
    start_idx: int | None = None
    for idx, is_silent in enumerate(silent + [False]):
        if is_silent and start_idx is None:
            start_idx = idx
        elif not is_silent and start_idx is not None:
            if idx - start_idx >= min_windows:
                ranges.append((start_idx * 0.05, idx * 0.05))
            start_idx = None

    return ranges
