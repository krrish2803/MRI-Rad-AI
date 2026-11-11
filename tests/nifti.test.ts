import { describe, expect, it } from 'vitest';
import { compareNiftiPair, inspectNiftiFile, NiftiMetadata } from '../src/utils/nifti';

function nifti1(dimensions: [number, number, number], spacing: [number, number, number]): Uint8Array {
  const bytes = new Uint8Array(352 + dimensions.reduce((product, size) => product * size, 1));
  const view = new DataView(bytes.buffer);
  view.setInt32(0, 348, true);
  view.setInt16(40, 3, true);
  dimensions.forEach((size, index) => view.setInt16(42 + index * 2, size, true));
  spacing.forEach((size, index) => view.setFloat32(80 + index * 4, size, true));
  bytes.set(new TextEncoder().encode('n+1\0'), 344);
  return bytes;
}

describe('NIfTI client checks', () => {
  it('parses a NIfTI-1 header and reads dimensions and spacing', async () => {
    const file = new File([nifti1([16, 20, 24], [0.7, 0.7, 3.5])], 't2.nii');
    const metadata = await inspectNiftiFile(file);
    expect(metadata.dimensions).toEqual([16, 20, 24]);
    expect(metadata.spacing).toEqual([expect.closeTo(0.7, 5), expect.closeTo(0.7, 5), 3.5]);
    expect(metadata.version).toBe(1);
  });

  it('reads gzip-compressed NIfTI files', async () => {
    const compressed = new Blob([nifti1([8, 9, 10], [1, 1, 2])])
      .stream()
      .pipeThrough(new CompressionStream('gzip'));
    const file = new File([await new Response(compressed).blob()], 'adc.nii.gz');
    await expect(inspectNiftiFile(file)).resolves.toMatchObject({ dimensions: [8, 9, 10] });
  });

  it('rejects non-NIfTI files and non-3D volumes', async () => {
    await expect(inspectNiftiFile(new File(['x'], 'scan.png'))).rejects.toThrow(/ending in \.nii/);
    const bytes = nifti1([8, 9, 10], [1, 1, 1]);
    new DataView(bytes.buffer).setInt16(40, 4, true);
    await expect(inspectNiftiFile(new File([bytes], 'volume.nii'))).rejects.toThrow(/3D NIfTI/);
  });

  it('reports shape and readable spacing mismatches', () => {
    const t2: NiftiMetadata = { dimensions: [16, 20, 24], spacing: [0.7, 0.7, 3.5], version: 1 };
    const adc: NiftiMetadata = { dimensions: [16, 20, 25], spacing: [0.7, 0.8, 3.5], version: 1 };
    const errors = compareNiftiPair(t2, adc);
    expect(errors).toHaveLength(2);
    expect(errors[0]).toContain('dimensions do not match');
    expect(errors[1]).toContain('voxel spacing does not match');
  });

  it('skips spacing comparison when either header has no readable spacing', () => {
    const t2: NiftiMetadata = { dimensions: [16, 20, 24], spacing: null, version: 1 };
    const adc: NiftiMetadata = { dimensions: [16, 20, 24], spacing: [0.7, 0.7, 3.5], version: 1 };
    expect(compareNiftiPair(t2, adc)).toEqual([]);
  });
});
