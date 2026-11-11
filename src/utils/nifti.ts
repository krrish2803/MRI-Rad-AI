export interface NiftiMetadata {
  dimensions: [number, number, number];
  spacing: [number, number, number] | null;
  version: 1 | 2;
}

export class NiftiValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NiftiValidationError';
  }
}

async function inflateIfNeeded(input: ArrayBuffer): Promise<ArrayBuffer> {
  const bytes = new Uint8Array(input);
  if (bytes[0] !== 0x1f || bytes[1] !== 0x8b) return input;
  if (typeof DecompressionStream === 'undefined') {
    throw new NiftiValidationError('This browser cannot read compressed NIfTI files. Try an uncompressed .nii file.');
  }
  const stream = new Blob([input]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream).arrayBuffer();
}

function readMagic(view: DataView, offset: number, length: number): string {
  return new TextDecoder().decode(new Uint8Array(view.buffer, view.byteOffset + offset, length));
}

function readNiftiHeader(buffer: ArrayBuffer): NiftiMetadata {
  if (buffer.byteLength < 348) {
    throw new NiftiValidationError('The selected file is too small to be a valid NIfTI volume.');
  }
  const view = new DataView(buffer);
  const littleEndian = view.getInt32(0, true) === 348 || view.getInt32(0, true) === 540;
  const headerSize = view.getInt32(0, littleEndian);

  if (headerSize === 348) {
    const magic = readMagic(view, 344, 4);
    if (!magic.startsWith('n+1')) {
      throw new NiftiValidationError('This file does not contain a single-file NIfTI-1 header.');
    }
    const rank = view.getInt16(40, littleEndian);
    const dimensions = [
      view.getInt16(42, littleEndian),
      view.getInt16(44, littleEndian),
      view.getInt16(46, littleEndian),
    ] as [number, number, number];
    if (rank !== 3 || dimensions.some((size) => size <= 0)) {
      throw new NiftiValidationError('Each input must be a 3D NIfTI volume.');
    }
    const spacing = [
      view.getFloat32(80, littleEndian),
      view.getFloat32(84, littleEndian),
      view.getFloat32(88, littleEndian),
    ] as [number, number, number];
    return {
      dimensions,
      spacing: spacing.every((value) => Number.isFinite(value) && value > 0) ? spacing : null,
      version: 1,
    };
  }

  if (headerSize === 540) {
    if (buffer.byteLength < 540 || !readMagic(view, 4, 4).startsWith('n+2')) {
      throw new NiftiValidationError('This file does not contain a single-file NIfTI-2 header.');
    }
    const rank = Number(view.getBigInt64(16, littleEndian));
    const dimensions = [
      Number(view.getBigInt64(24, littleEndian)),
      Number(view.getBigInt64(32, littleEndian)),
      Number(view.getBigInt64(40, littleEndian)),
    ] as [number, number, number];
    if (rank !== 3 || dimensions.some((size) => !Number.isSafeInteger(size) || size <= 0)) {
      throw new NiftiValidationError('Each input must be a 3D NIfTI volume.');
    }
    const spacing = [
      view.getFloat64(112, littleEndian),
      view.getFloat64(120, littleEndian),
      view.getFloat64(128, littleEndian),
    ] as [number, number, number];
    return {
      dimensions,
      spacing: spacing.every((value) => Number.isFinite(value) && value > 0) ? spacing : null,
      version: 2,
    };
  }

  throw new NiftiValidationError('The selected file is not a supported NIfTI-1 or NIfTI-2 volume.');
}

export async function inspectNiftiFile(file: File): Promise<NiftiMetadata> {
  if (!/\.nii(\.gz)?$/i.test(file.name)) {
    throw new NiftiValidationError('Choose a NIfTI file ending in .nii or .nii.gz.');
  }
  try {
    return readNiftiHeader(await inflateIfNeeded(await file.arrayBuffer()));
  } catch (error) {
    if (error instanceof NiftiValidationError) throw error;
    throw new NiftiValidationError('The selected NIfTI file could not be read.');
  }
}

export function compareNiftiPair(t2: NiftiMetadata, adc: NiftiMetadata): string[] {
  const errors: string[] = [];
  if (t2.dimensions.some((size, index) => size !== adc.dimensions[index])) {
    errors.push(`T2 and ADC dimensions do not match (T2 ${t2.dimensions.join(' × ')}, ADC ${adc.dimensions.join(' × ')}).`);
  }
  if (t2.spacing && adc.spacing && t2.spacing.some((value, index) => Math.abs(value - adc.spacing![index]) > 0.001)) {
    errors.push(`T2 and ADC voxel spacing does not match (T2 ${t2.spacing.join(' × ')} mm, ADC ${adc.spacing.join(' × ')} mm).`);
  }
  return errors;
}
