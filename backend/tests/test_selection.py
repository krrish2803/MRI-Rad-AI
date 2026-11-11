import pytest

from app.services.selection import default_slice_indices, validate_slice_indices


def test_default_slices_are_evenly_spaced_in_middle_of_volume():
    indices = default_slice_indices(40, 5)
    assert len(indices) == 5
    assert indices[0] >= 7 and indices[-1] <= 32
    assert indices == sorted(set(indices))


def test_single_or_short_series_uses_all_slices():
    assert default_slice_indices(1, 5) == [0]
    assert default_slice_indices(3, 5) == [0, 1, 2]


@pytest.mark.parametrize("values", [[-1], [4], [1, 1], []])
def test_selection_rejects_out_of_range_duplicate_or_empty(values):
    with pytest.raises(ValueError):
        validate_slice_indices(values, 4)
