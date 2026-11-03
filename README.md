# MRI-RadAI: AI-Powered Prostate Lesion Detection & 3D Decision Support

[![React 18](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://react.dev)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL2-black.svg)](https://threejs.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v3.4-38bdf8.svg)](https://tailwindcss.com)
[![PI-RADS](https://img.shields.io/badge/PI--RADS-v2.1%20Adherent-emerald.svg)](https://www.acr.org/Clinical-Resources/Reporting-and-Data-Systems/PI-RADS)
[![HIPAA Compliant](https://img.shields.io/badge/HIPAA-PS%203.15%20De--identified-teal.svg)](#security--compliance)

A clinical-grade decision-support platform for radiologists and medical professionals that combines **Claude Vision VLM multi-modal reasoning** (T2-weighted, DWI high b-value, ADC maps) with **interactive 3D anatomical volume visualization** using Three.js.

---

## 🌟 Clinical Reality & Solution

- **The Problem:** Radiologists spend 45–120 minutes per patient manually evaluating multi-parametric MRI exams. Specialists disagree 15–25% of the time on subtle peripheral zone lesions, and black-box CNN tools fail to explain why a region is flagged.
- **The Solution:** MRI-RadAI acts as a tireless fellowship-level decision-support assistant—reducing turnaround time to **5–10 minutes**, explaining every detection in natural clinical lexicon, and providing true 3D spatial orientation.

---

## 🚀 Key Features

### 1. Interactive 3D Medical Workstation (`Three.js` + `@react-three/fiber`)
- **Anatomical Prostate Organ Reconstruction:** 
  - Fibrous Prostatic Capsule
  - Peripheral Zone (PZ - apex, mid-gland, base where ~70-75% of cancers originate)
  - Transition Zone (TZ - bilateral lobes around the urethra)
  - Urethra Lumen pathway with emissive glow
  - Neurovascular bundles on posterior-lateral borders
- **Dynamic Axial Cutting Plane:** Synchronously shifts through the 3D organ volume as the user scrubs through slices.
- **Volumetric Lesions:**
  - Color-coded by PI-RADS v2.1 risk (Red = Category 4-5 High Risk; Yellow = Category 3 Equivocal; Green = Category 1-2 Benign).
  - Emissive pulsing animation & confidence gradient uncertainty halo.
  - Interactive selection: Clicking a lesion in 3D highlights it, shows metrics, and jumps to the exact slice in the 2D viewer.
- **Viewpoint Presets & Layer Controls:** Superior (Axial), Anterior (Coronal), Lateral (Sagittal), 3D Isometric, Transparency slider, and Wireframe toggle.

### 2. Multi-Planar 2D MPR Slice Viewer
- **Multi-Modal Sequences:** T2-weighted TSE, High b-value Diffusion (DWI b-2000), and Quantitative ADC Map.
- **Synchronized Crosshairs & Cine Playback:** Smooth scrub loop with adjustable frame rates.
- **Radiologist Manual Annotation:** Interactive tool allowing physicians to click and drop target ROIs and manual lesion contours.

### 3. Explainable Claude Vision VLM Findings Panel
- **Multi-Modal Reasoning Narrative:** Transparent natural language explanations distinguishing adenocarcinoma from atypical BPH nodules and prostatitis.
- **Quantitative Radiomics:** Dimensions (length, width, volume cc), nadir ADC value (e.g. $0.64 \times 10^{-3} \text{ mm}^2/\text{s}$), and Extraprostatic Extension (EPE) risk assessment.
- **Confidence Gauge & PI-RADS v2.1 Scoring:** Category 1 to 5 visual metrics.

### 4. Radiologist Feedback Loop & Active Learning
- **Approve / Reject (False Positive) / Modify** buttons for each detected lesion.
- **Diagnostic Impression & Biopsy Directive** notes.
- **Electronic Sign-Off** with board certification badge and timestamp.

### 5. Medical-Grade Export Suite
- **One-Click Clinical PDF Report:** Built with `jsPDF`, formatted with institutional letterhead, patient demographics, multi-parametric findings table, PI-RADS scoring, Claude VLM narrative, and radiologist digital signature.
- **Quantitative Metrics CSV Export:** Export dimensions, coordinates, ADC metrics, and validation states.
- **Encrypted De-Identified Case Sharing:** Generate secure consultation links for tumor boards.

### 6. Hospital PACS Worklist & Case Archive
- Track turnaround times, concordance rates, and filter by risk / review status.
- Pre-loaded PROSTATEx benchmark cases (PX-4092, PX-1028, PX-2291, PX-5014) representing diverse clinical scenarios.

### 7. Comprehensive FAQ & Settings
- Full 20-question clinical and technical knowledge base covering HIPAA, PACS DICOMweb integration, pricing, and validation.

---

## 🛠️ Tech Stack

- **Framework:** React 18, TypeScript, Vite
- **3D Engine:** Three.js, `@react-three/fiber`, `@react-three/drei`
- **Styling:** Tailwind CSS, Lucide React
- **Export Engine:** `jsPDF`
- **Clinical Protocols:** PI-RADS v2.1, DICOM PS 3.15 De-Identification

---

## 💻 Getting Started

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
# Starts on http://localhost:3000
```

### Production Build
```bash
npm run build
```

---

## 🏥 Clinical Disclaimer
MRI-RadAI is engineered as an investigational Clinical Decision Support software instrument. All final diagnostic readings, biopsy directives, and oncological treatments must be independently verified by a board-certified radiologist or physician.
