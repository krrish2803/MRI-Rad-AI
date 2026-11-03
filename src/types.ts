export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'Attending Radiologist' | 'Radiology Fellow' | 'Urological Oncologist' | 'PACS Administrator' | 'Guest Clinical Evaluator';
  institution: string;
  npiNumber?: string;
  avatar?: string;
}

export type RiskLevel = 'low' | 'medium' | 'high';

export type AnatomicalZone = 
  | 'PZ - Peripheral Zone (Apex)' 
  | 'PZ - Peripheral Zone (Mid-Gland)' 
  | 'PZ - Peripheral Zone (Base)'
  | 'TZ - Transition Zone (Mid-Gland)'
  | 'TZ - Transition Zone (Base)'
  | 'AFS - Anterior Fibromuscular Stroma'
  | 'CZ - Central Zone';

export interface Lesion {
  id: string;
  name: string;
  risk: RiskLevel;
  piradsScore: 1 | 2 | 3 | 4 | 5;
  confidence: number; // 0-100%
  zone: AnatomicalZone;
  coordinates: {
    x: number; // mm
    y: number; // mm
    z: number; // mm
  };
  sliceIndex: {
    axial: number;
    sagittal: number;
    coronal: number;
  };
  dimensions: {
    lengthMm: number;
    widthMm: number;
    volumeCc: number;
  };
  characteristics: {
    t2Signal: string;
    dwiSignal: string;
    adcValue: string; // e.g. "0.68 x 10^-3 mm²/s"
    enhancement: string;
    extraprostaticExtension: boolean;
    capsularAbutment: boolean;
  };
  vlmExplanation: string;
  radiologistStatus?: 'approved' | 'rejected' | 'modified' | 'pending';
  radiologistNotes?: string;
  isUserAdded?: boolean;
}

export interface PatientCase {
  id: string;
  accessionNumber: string;
  patientId: string;
  patientName: string;
  age: number;
  gender: string;
  psaLevel: number; // ng/mL
  psaDensity: number; // ng/mL²
  priorBiopsy: string;
  scanDate: string;
  magnetField: '3.0T' | '1.5T';
  coilType: 'Endorectal + Pelvic Phased Array' | 'Pelvic Phased Array';
  manufacturer: string;
  seriesAvailable: Array<'T2 Axial' | 'T2 Sagittal' | 'T2 Coronal' | 'DWI b-2000' | 'ADC Map' | 'DCE Dynamic'>;
  primaryRisk: RiskLevel;
  primaryPirads: number;
  overallConfidence: number;
  lesionsDetectedCount: number;
  lesions: Lesion[];
  claudeSummary: string;
  clinicalRecommendation: string;
  status: 'Unread' | 'AI Analyzed' | 'Radiologist Reviewed' | 'Signed Off';
  reviewedBy?: string;
  reviewDate?: string;
}

export interface RadiologistAnnotation {
  id: string;
  sliceIndex: number;
  plane: 'axial' | 'sagittal' | 'coronal';
  x: number; // relative 0-100%
  y: number; // relative 0-100%
  radius: number;
  label: string;
  notes: string;
  createdAt: string;
}
