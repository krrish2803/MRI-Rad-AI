from collections.abc import Iterable


def default_slice_indices(slice_count: int, requested_count: int) -> list[int]:
    if slice_count <= 0:
        return []
    if slice_count <= requested_count:
        return list(range(slice_count))
    if slice_count == 1:
        return [0]
    start = round((slice_count - 1) * 0.2)
    stop = round((slice_count - 1) * 0.8)
    values = []
    for i in range(requested_count):
        idx = round(start + (stop - start) * i / max(1, requested_count - 1))
        if idx not in values:
            values.append(idx)
    return values


def validate_slice_indices(indices: Iterable[int], slice_count: int) -> list[int]:
    result = list(indices)
    if not result:
        raise ValueError("At least one slice must be selected for each upload.")
    if len(result) != len(set(result)):
        raise ValueError("Slice indices must be distinct per upload.")
    if any(index < 0 or index >= slice_count for index in result):
        raise ValueError(f"Slice indices must be between 0 and {slice_count - 1}.")
    return result
