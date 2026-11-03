import { PatientCase } from './types';

export const MOCK_PATIENTS: PatientCase[] = [
  {
    id: 'PX-4092',
    accessionNumber: 'RAD-2026-90421',
    patientId: 'PT-99402',
    patientName: 'Anonymous Patient #4092',
    age: 68,
    gender: 'Male',
    psaLevel: 9.4,
    psaDensity: 0.22,
    priorBiopsy: 'Negative (14 months ago)',
    scanDate: '2026-09-28',
    magnetField: '3.0T',
    coilType: 'Pelvic Phased Array',
    manufacturer: 'Siemens MAGNETOM Vida 3T',
    seriesAvailable: ['T2 Axial', 'T2 Sagittal', 'T2 Coronal', 'DWI b-2000', 'ADC Map', 'DCE Dynamic'],
    primaryRisk: 'high',
    primaryPirads: 5,
    overallConfidence: 94.8,
    lesionsDetectedCount: 2,
    status: 'AI Analyzed',
    reviewedBy: 'Dr. Marcus Vance, MD (Chief Radiologist)',
    reviewDate: 'Pending Verification',
    claudeSummary: 
      'Multi-modal VLM reasoning identifies a prominent 16.4 mm focal lesion in the right mid-gland peripheral zone (PZpl) with marked T2 hypointensity, intense b-2000 diffusion restriction, and corresponding profound ADC hypointensity (ADC min: 0.64 × 10⁻³ mm²/s). Findings meet PI-RADS v2.1 Category 5 criteria with suspicious 11 mm capsular contact contour bulging concerning for early focal extraprostatic extension.',
    clinicalRecommendation: 
      'High clinical suspicion for clinically significant prostate cancer (csPCa, ISUP Grade Group ≥ 3). Recommend targeted MRI-ultrasound fusion transperineal core biopsy with systematic mapping.',
    lesions: [
      {
        id: 'lesion-1',
        name: 'Target Lesion #1 (Index)',
        risk: 'high',
        piradsScore: 5,
        confidence: 96,
        zone: 'PZ - Peripheral Zone (Mid-Gland)',
        coordinates: { x: 14.2, y: -8.5, z: 4.1 },
        sliceIndex: { axial: 14, sagittal: 16, coronal: 15 },
        dimensions: { lengthMm: 16.4, widthMm: 12.1, volumeCc: 1.28 },
        characteristics: {
          t2Signal: 'Marked homogenous focal hypointensity with indistinct margins',
          dwiSignal: 'Profound focal hyperintensity on high b-value (b-2000 s/mm²)',
          adcValue: '0.64 × 10⁻³ mm²/s (Severe restricted diffusion)',
          enhancement: 'Early focal hyper-enhancement concordant with T2/DWI finding',
          extraprostaticExtension: true,
          capsularAbutment: true
        },
        vlmExplanation: 
          'The index lesion displays classic multi-modal hallmarks of high-grade adenocarcinoma in the peripheral zone. On axial T2 TSE, it presents as an ill-defined eradiating hypointense focus measuring 16.4 mm. Diffusion-weighted imaging at b=2000 exhibits intense focal signal restriction with marked signal suppression on the quantitative ADC map (mean ADC 0.64 × 10⁻³ mm²/s). The lesion abuts the prostatic pseudocapsule over an arc of >10 mm with slight contour bulging, conferring a PI-RADS 5 designation and heightened risk of microscopic capsular breach.',
        radiologistStatus: 'pending'
      },
      {
        id: 'lesion-2',
        name: 'Secondary Lesion #2',
        risk: 'medium',
        piradsScore: 3,
        confidence: 78,
        zone: 'TZ - Transition Zone (Mid-Gland)',
        coordinates: { x: -6.8, y: 5.2, z: -2.3 },
        sliceIndex: { axial: 18, sagittal: 12, coronal: 13 },
        dimensions: { lengthMm: 8.5, widthMm: 6.2, volumeCc: 0.32 },
        characteristics: {
          t2Signal: 'Heterogeneous nodular signal with partially defined capsule',
          dwiSignal: 'Mild focal hyperintensity on b-2000',
          adcValue: '0.98 × 10⁻³ mm²/s (Moderate reduction)',
          enhancement: 'Indeterminate progressive enhancement',
          extraprostaticExtension: false,
          capsularAbutment: false
        },
        vlmExplanation: 
          'Located in the left anterior transition zone, this lesion demonstrates atypical features between an atypical BPH hyperplastic nodule and a true transitional neoplasm. T2 shows partially encapsulated margins with moderate central low signal. ADC demonstrates moderate reduction (0.98 × 10⁻³ mm²/s) without marked b-2000 restriction. Assigned PI-RADS Category 3 (equivocal). Secondary biopsy target depending on radiologist multidisciplinary review.',
        radiologistStatus: 'pending'
      }
    ]
  },
  {
    id: 'PX-1028',
    accessionNumber: 'RAD-2026-88192',
    patientId: 'PT-81093',
    patientName: 'Anonymous Patient #1028',
    age: 62,
    gender: 'Male',
    psaLevel: 6.1,
    psaDensity: 0.14,
    priorBiopsy: 'Biopsy Naive',
    scanDate: '2026-09-30',
    magnetField: '3.0T',
    coilType: 'Pelvic Phased Array',
    manufacturer: 'GE SIGNA Premier 3.0T',
    seriesAvailable: ['T2 Axial', 'T2 Sagittal', 'T2 Coronal', 'DWI b-2000', 'ADC Map'],
    primaryRisk: 'high',
    primaryPirads: 4,
    overallConfidence: 89.2,
    lesionsDetectedCount: 1,
    status: 'Radiologist Reviewed',
    reviewedBy: 'Dr. Eleanor Brooks, MD',
    reviewDate: '2026-10-01',
    claudeSummary: 
      'Prominent 11.8 mm wedge-shaped focus in the left apical peripheral zone with marked focal restriction on DWI and low ADC signal. Meets criteria for PI-RADS 4 (clinically significant cancer likely). Gland margins appear preserved with no overt capsular bulge.',
    clinicalRecommendation: 
      'Targeted transperineal biopsy of the left apical PZ lesion recommended. PSA density of 0.14 is borderline elevated.',
    lesions: [
      {
        id: 'lesion-3',
        name: 'Target Lesion #1 (Apical)',
        risk: 'high',
        piradsScore: 4,
        confidence: 91,
        zone: 'PZ - Peripheral Zone (Apex)',
        coordinates: { x: -11.5, y: -6.0, z: -10.2 },
        sliceIndex: { axial: 7, sagittal: 9, coronal: 8 },
        dimensions: { lengthMm: 11.8, widthMm: 8.4, volumeCc: 0.54 },
        characteristics: {
          t2Signal: 'Wedge-shaped focal hypointensity in peripheral zone',
          dwiSignal: 'Marked focal hyperintensity on high b-value',
          adcValue: '0.72 × 10⁻³ mm²/s',
          enhancement: 'Early focal arterial phase enhancement',
          extraprostaticExtension: false,
          capsularAbutment: false
        },
        vlmExplanation: 
          'Wedge-shaped morphologic focus in left apex PZ. While prostatitis can simulate wedge-shaped hypointensity, the marked restriction on b-2000 and corresponding ADC drop to 0.72 favors neoplastic etiology. Sizing <15mm places this strictly in PI-RADS 4.',
        radiologistStatus: 'approved'
      }
    ]
  },
  {
    id: 'PX-2291',
    accessionNumber: 'RAD-2026-74910',
    patientId: 'PT-63914',
    patientName: 'Anonymous Patient #2291',
    age: 55,
    gender: 'Male',
    psaLevel: 4.3,
    psaDensity: 0.08,
    priorBiopsy: 'None',
    scanDate: '2026-10-02',
    magnetField: '1.5T',
    coilType: 'Pelvic Phased Array',
    manufacturer: 'Philips Ingenia 1.5T',
    seriesAvailable: ['T2 Axial', 'T2 Sagittal', 'DWI b-2000', 'ADC Map'],
    primaryRisk: 'low',
    primaryPirads: 2,
    overallConfidence: 92.0,
    lesionsDetectedCount: 1,
    status: 'Signed Off',
    reviewedBy: 'Dr. Sarah Jenkins, MD',
    reviewDate: '2026-10-03',
    claudeSummary: 
      'No discrete focal suspicious lesions identified in the peripheral zones. Transition zone displays classic benign prostatic hyperplasia (BPH) stromal and glandular nodules with intact complete hypointense pseudocapsules.',
    clinicalRecommendation: 
      'Benign prostate MRI (PI-RADS 2). No targeted biopsy required. Routine clinical surveillance of serum PSA in 12 months.',
    lesions: [
      {
        id: 'lesion-4',
        name: 'Benign Stromal Nodule',
        risk: 'low',
        piradsScore: 2,
        confidence: 93,
        zone: 'TZ - Transition Zone (Base)',
        coordinates: { x: 3.2, y: 7.4, z: 8.1 },
        sliceIndex: { axial: 23, sagittal: 21, coronal: 20 },
        dimensions: { lengthMm: 14.1, widthMm: 12.0, volumeCc: 1.12 },
        characteristics: {
          t2Signal: 'Round well-circumscribed encapsulated heterogeneous nodule',
          dwiSignal: 'T2 shine-through without true restriction',
          adcValue: '1.34 × 10⁻³ mm²/s (Normal physiological range)',
          enhancement: 'Gradual slow wash-in',
          extraprostaticExtension: false,
          capsularAbutment: false
        },
        vlmExplanation: 
          'Classic organized benign hyperplastic adenoma with continuous peripheral rim of low T2 signal (halo sign). ADC value is within benign physiologic parenchyma thresholds (1.34 × 10⁻³ mm²/s). Absence of diffusion restriction excludes high-grade tumor.',
        radiologistStatus: 'approved'
      }
    ]
  },
  {
    id: 'PX-5014',
    accessionNumber: 'RAD-2026-99214',
    patientId: 'PT-10492',
    patientName: 'Anonymous Patient #5014',
    age: 71,
    gender: 'Male',
    psaLevel: 14.8,
    psaDensity: 0.38,
    priorBiopsy: 'Active Surveillance (Gleason 3+3)',
    scanDate: '2026-10-04',
    magnetField: '3.0T',
    coilType: 'Endorectal + Pelvic Phased Array',
    manufacturer: 'Siemens MAGNETOM Prisma 3T',
    seriesAvailable: ['T2 Axial', 'T2 Sagittal', 'T2 Coronal', 'DWI b-2000', 'ADC Map', 'DCE Dynamic'],
    primaryRisk: 'high',
    primaryPirads: 5,
    overallConfidence: 97.4,
    lesionsDetectedCount: 1,
    status: 'AI Analyzed',
    claudeSummary: 
      'Large aggressive 21.5 mm lesion centered in anterior fibromuscular stroma and transition zone with direct anterior capsular invasion and gross neurovascular contact. Intense restriction and marked DCE washout indicates disease progression.',
    clinicalRecommendation: 
      'Urgent multidisciplinary oncology consultation. High risk for locally advanced prostate cancer (T3a/T3b). Biopsy re-classification recommended.',
    lesions: [
      {
        id: 'lesion-5',
        name: 'Invasive Anterior Lesion',
        risk: 'high',
        piradsScore: 5,
        confidence: 98,
        zone: 'AFS - Anterior Fibromuscular Stroma',
        coordinates: { x: 0.5, y: 15.2, z: 2.0 },
        sliceIndex: { axial: 15, sagittal: 14, coronal: 14 },
        dimensions: { lengthMm: 21.5, widthMm: 17.2, volumeCc: 3.45 },
        characteristics: {
          t2Signal: 'Erasing normal anterior fibromuscular stroma anatomy',
          dwiSignal: 'Very strong b-2000 hyperintensity with necrotic center',
          adcValue: '0.52 × 10⁻³ mm²/s (Extreme restriction)',
          enhancement: 'Rapid wash-in with early focal wash-out',
          extraprostaticExtension: true,
          capsularAbutment: true
        },
        vlmExplanation: 
          'The lesion exceeds 20mm with frank infiltration across anatomical boundaries from anterior transition zone into the fibromuscular stroma. Extreme diffusion limitation (ADC nadir 0.52 × 10⁻³ mm²/s) with gross capsular irregularity satisfies PI-RADS 5 criteria with definitive extraprostatic extension (EPE).',
        radiologistStatus: 'pending'
      }
    ]
  }
];

export const INSTITUTIONS = [
  { name: 'Mayo Clinic Radiogenomics Center', location: 'Rochester, MN', badge: 'Clinical Trial Lead' },
  { name: 'Memorial Sloan Kettering Cancer Center', location: 'New York, NY', badge: 'Validation Partner' },
  { name: 'Stanford Medicine Radiology AI Lab', location: 'Stanford, CA', badge: 'PACS Pilot Cohort' },
  { name: 'Charité Comprehensive Cancer Center', location: 'Berlin, Germany', badge: 'EU CE Compliance' },
  { name: 'Johns Hopkins Urological Oncology', location: 'Baltimore, MD', badge: 'PROSTATEx Benchmark' }
];

export const BENCHMARK_METRICS = {
  sensitivity: 89.4,
  specificity: 91.2,
  aucRoc: 0.941,
  casesEvaluated: 346,
  timeSavedMinutes: '45-120 → 5-10',
  interRaterAgreement: 'Cohen κ 0.88'
};
