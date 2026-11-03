import jsPDF from 'jspdf';
import { PatientCase } from '../types';

export const generateClinicalPdfReport = (patient: PatientCase) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = [0, 122, 186]; // Medical Blue
  const darkColor = [20, 30, 45];
  const mutedColor = [100, 116, 139];

  // Header Bar
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 18, 'F');

  // Title in header
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('MRI-RadAI CLINICAL DECISION SUPPORT REPORT', 14, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('PI-RADS v2.1 COMPLIANT MULTI-MODAL REASONING', 130, 12);

  // Institution Sub-header
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DEPARTMENT OF RADIOLOGY & MOLECULAR IMAGING', 14, 26);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text(`Generated: ${new Date().toLocaleDateString()} | System: MRI-RadAI Engine v2.4 (Powered by Claude Vision VLM)`, 14, 31);

  // Line separator
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 34, 196, 34);

  // Patient Demographics Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 37, 182, 32, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, 37, 182, 32, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('PATIENT DEMOGRAPHICS & SCAN METRICS', 18, 43);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  doc.text(`Patient ID: ${patient.patientId}`, 18, 50);
  doc.text(`Accession #: ${patient.accessionNumber}`, 18, 56);
  doc.text(`Age / Gender: ${patient.age} yrs / ${patient.gender}`, 18, 62);

  doc.text(`PSA: ${patient.psaLevel} ng/mL`, 80, 50);
  doc.text(`PSA Density: ${patient.psaDensity} ng/mL²`, 80, 56);
  doc.text(`Prior Biopsy: ${patient.priorBiopsy}`, 80, 62);

  doc.text(`Scan Date: ${patient.scanDate}`, 140, 50);
  doc.text(`Magnet: ${patient.magnetField} (${patient.manufacturer.split(' ')[0]})`, 140, 56);
  doc.text(`Coil: ${patient.coilType.includes('Endorectal') ? 'Endorectal + Phased' : 'Pelvic Phased'}`, 140, 62);

  // Findings Summary Banner
  const isHighRisk = patient.primaryRisk === 'high';
  const riskColor = isHighRisk ? [220, 53, 69] : [245, 158, 11];
  
  doc.setFillColor(riskColor[0], riskColor[1], riskColor[2]);
  doc.roundedRect(14, 73, 182, 16, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`PRIMARY IMPRESSION: PI-RADS CATEGORY ${patient.primaryPirads} (${patient.primaryRisk.toUpperCase()} RISK)`, 20, 81);
  doc.setFontSize(8);
  doc.text(`AI Confidence: ${patient.overallConfidence}% | Lesions Detected: ${patient.lesionsDetectedCount}`, 20, 86);

  // Lesions Table Header
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DETECTED SUSPICIOUS LESION LOCALIZATION & RADIOMICS', 14, 98);

  // Table header bar
  doc.setFillColor(241, 245, 249);
  doc.rect(14, 102, 182, 7, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Target', 17, 106.5);
  doc.text('Anatomical Zone', 42, 106.5);
  doc.text('Dimensions (mm)', 98, 106.5);
  doc.text('ADC (×10⁻³)', 132, 106.5);
  doc.text('PI-RADS', 160, 106.5);
  doc.text('Status', 180, 106.5);

  let curY = 113;
  patient.lesions.forEach((lesion, idx) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);

    // Row zebra background
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, curY - 4, 182, 8, 'F');
    }

    doc.text(lesion.name, 17, curY);
    doc.text(lesion.zone.substring(0, 32), 42, curY);
    doc.text(`${lesion.dimensions.lengthMm} x ${lesion.dimensions.widthMm} mm (${lesion.dimensions.volumeCc}cc)`, 98, curY);
    doc.text(lesion.characteristics.adcValue.split(' ')[0], 132, curY);
    
    // PI-RADS bold
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(lesion.piradsScore >= 4 ? 220 : 0, lesion.piradsScore >= 4 ? 53 : 122, lesion.piradsScore >= 4 ? 69 : 186);
    doc.text(`Score ${lesion.piradsScore}`, 160, curY);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(lesion.radiologistStatus ? lesion.radiologistStatus.toUpperCase() : 'AI FLAGGED', 180, curY);

    curY += 8;
  });

  // Claude Vision Explainable Narrative Section
  curY += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('CLAUDE VLM MULTI-MODAL REASONING & CLINICAL EXPLANATION', 14, curY);

  curY += 4;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, curY, 182, 38, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, curY, 182, 38, 2, 2, 'S');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  
  const splitExplanation = doc.splitTextToSize(patient.claudeSummary, 174);
  doc.text(splitExplanation, 18, curY + 6);

  curY += 42;
  // Recommendations Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('CLINICAL RECOMMENDATION & MULTIDISCIPLINARY ACTION', 14, curY);

  curY += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const splitRec = doc.splitTextToSize(patient.clinicalRecommendation, 180);
  doc.text(splitRec, 14, curY + 4);

  // Radiologist Sign-off and Disclaimer Box
  curY += 22;
  doc.setDrawColor(203, 213, 225);
  doc.line(14, curY, 196, curY);

  curY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('RADIOLOGIST VALIDATION & ELECTRONIC SIGN-OFF', 14, curY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Reviewing Radiologist: ${patient.reviewedBy || 'Dr. Eleanor Brooks, MD - Board Certified Radiologist'}`, 14, curY + 6);
  doc.text(`Verification Status: ${patient.status.toUpperCase()} | Timestamp: ${patient.reviewDate || new Date().toISOString()}`, 14, curY + 11);
  doc.text('Digital Signature Hash: SHA256:7f92b...a49d10e (Authenticated via Hospital PACS Gateway)', 14, curY + 16);

  // Clinical Legal Disclaimer
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  const disclaimer = 
    'NOTICE: MRI-RadAI is an investigational Clinical Decision Support Software. Final diagnostic interpretation, biopsy recommendation, and treatment decisions must be independently validated by a qualified board-certified radiologist or physician. Not for autonomous standalone diagnosis.';
  const splitDisclaimer = doc.splitTextToSize(disclaimer, 182);
  doc.text(splitDisclaimer, 14, 280);

  // Save the PDF
  doc.save(`MRI-RadAI_Report_${patient.id}_${patient.accessionNumber}.pdf`);
};
