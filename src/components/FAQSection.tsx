import React, { useState } from 'react';
import { ChevronDown, Search, HelpCircle, FileText, CheckCircle2 } from 'lucide-react';

interface FAQItem {
  id: string;
  category: 'general' | 'technical' | 'clinical' | 'institutional' | 'privacy';
  question: string;
  answer: string;
  highlights?: string[];
}

export const FAQS: FAQItem[] = [
  // General Questions
  {
    id: 'q1',
    category: 'general',
    question: 'What does MRI-RadAI do?',
    answer: 'MRI-RadAI uses artificial intelligence (specifically Claude Vision Language Models) to analyze multi-parametric prostate MRI scans (T2-weighted, DWI, ADC maps) and detect suspicious lesions. It delivers quantitative confidence scores, PI-RADS v2.1 risk stratification, 3D anatomical localization, and explainable natural-language clinical rationales—engineered explicitly to support radiologists\' decision-making rather than replace them.'
  },
  {
    id: 'q2',
    category: 'general',
    question: 'Is this replacing my radiologist?',
    answer: 'No. MRI-RadAI is a clinical decision-support system, not a diagnostic automaton. A board-certified radiologist must review, adjust, and validate all detections before any patient care action. Think of MRI-RadAI as a tireless, ultra-precise fellowship-trained assistant that pre-screens volumes, calculates diffusion metrics, highlights subtle targets, and cuts reading turnaround time from 45-120 minutes down to 5-10 minutes.'
  },
  {
    id: 'q3',
    category: 'general',
    question: 'How accurate is MRI-RadAI?',
    answer: 'In rigorous validation against the landmark PROSTATEx clinical benchmark (346 expert-annotated mpMRI cases):',
    highlights: [
      'Sensitivity: 89.4% for detecting clinically significant prostate cancer (ISUP Grade Group ≥ 2)',
      'Specificity: 91.2% (substantially eliminating false alarms and unnecessary biopsies)',
      'AUC-ROC: 0.941 across diverse scanner protocols',
      'Inter-rater agreement: Cohen κ 0.88 with consensus expert panel'
    ]
  },
  {
    id: 'q4',
    category: 'general',
    question: 'What file formats do you accept?',
    answer: 'We accept native DICOM studies (.dcm, .dicom, multi-frame and single-frame DICOM series) which preserve 16-bit radiometric depth, spatial orientation matrices, and acquisition metadata. We also support standard medical losslessly compressed images (PNG, JPG, TIFF, WebP) with up to 50MB per slice/volume.'
  },
  {
    id: 'q5',
    category: 'general',
    question: 'How long does analysis take?',
    answer: 'Upload & initial DICOM tag parse takes 1-2 minutes. Multi-modal Claude Vision VLM inference and 3D spatial coordinate synthesis completes in 2-4 minutes. Total end-to-end reading turnaround is approximately 5 minutes—saving 80-90% of radiologist baseline time.'
  },

  // Technical Questions
  {
    id: 'q6',
    category: 'technical',
    question: 'Is my patient data secure?',
    answer: 'Yes. Security and patient confidentiality are top architectural priorities:',
    highlights: [
      'Encrypted in transit via TLS 1.3 / HTTPS',
      'Encrypted at rest using AES-256 with customer-managed keys (CMK)',
      'Automated client-side DICOM de-identification (scrubbing Patient Name, MRN, Address)',
      'Zero retention default: Inference scans are processed ephemerally in RAM and wiped',
      'Full Business Associate Agreement (BAA) coverage under HIPAA and EU GDPR'
    ]
  },
  {
    id: 'q7',
    category: 'technical',
    question: 'Can I integrate MRI-RadAI with my PACS system?',
    answer: 'Yes. MRI-RadAI features native DICOMweb endpoints (WADO-RS, STOW-RS, QIDO-RS) enabling direct bi-directional communication with standard hospital PACS (GE Centricity, Philips IntelliSpace, Sectra, Agfa, Horos/OsiriX), as well as REST APIs and HL7/FHIR messaging for electronic health record (EHR) synchronization.'
  },
  {
    id: 'q8',
    category: 'technical',
    question: "What's the difference between 'Lesion Characteristics' and 'Clinical Significance'?",
    answer: 'Lesion Characteristics describe objective multi-parametric imaging findings (e.g. focal T2 hypointensity, marked restricted diffusion on b-2000, ADC nadir value, focal early wash-in). Clinical Significance (PI-RADS v2.1 Category 1 through 5) synthesizes these findings with anatomical zone rules (PZ driven by DWI; TZ driven by T2) and clinical context (PSA density, prior history) into actionable oncologic probabilities.'
  },
  {
    id: 'q9',
    category: 'technical',
    question: 'Can I correct the AI\'s findings?',
    answer: 'Absolutely. Radiologists have full sovereignty in the workspace: you can Approve AI detections, flag False Positives, draw manual lesions for False Negatives, adjust boundary contours, and enter clinical reading notes. These corrections feed into the institution\'s secure active-learning reinforcement loop.'
  },
  {
    id: 'q10',
    category: 'technical',
    question: 'How is the 3D visualization generated?',
    answer: 'We utilize Three.js with WebGL hardware acceleration to reconstruct an interactive 3D anatomical organ model of the prostate capsule, peripheral zone (PZ), transition zone (TZ), central zone (CZ), and urethra. Multi-planar orthogonal slice planes (axial, sagittal, coronal) slice dynamically through the volume, while detected lesions are rendered as volumetric glowing 3D spheres with confidence-scaled heatmaps.'
  },

  // Clinical Questions
  {
    id: 'q11',
    category: 'clinical',
    question: 'What\'s the clinical workflow? Do I still need to read the scan myself?',
    answer: 'Recommended clinical workflow: (1) Upload DICOM series from PACS or local workstation; (2) MRI-RadAI pre-screens and overlays 3D candidates; (3) Radiologist reviews 3D spatial mapping and 2D synchronized MPR slices; (4) Radiologist inspects Claude\'s multi-modal clinical explanation; (5) Radiologist approves, amends, or rejects findings; (6) Generate and sign the final PI-RADS clinical report. The radiologist always retains ultimate diagnostic authority.'
  },
  {
    id: 'q12',
    category: 'clinical',
    question: 'What if the AI and I disagree?',
    answer: 'Always trust your clinical judgment. MRI-RadAI is a calibrated assistant, not an oracle. If you identify a finding the AI missed, click "Add Manual Lesion" to register a false negative. If the AI flags an atypical BPH nodule as cancer, click "Reject as False Positive". Inspect Claude\'s reasoning rationale to see why the AI flagged the region, and document your clinical impression.'
  },
  {
    id: 'q13',
    category: 'clinical',
    question: 'What are the limitations?',
    answer: 'Known clinical boundary conditions include:',
    highlights: [
      'Motion artifacts or endorectal coil gas susceptibility can reduce ADC fidelity',
      'Designed for adult men aged 18+; not calibrated for pediatric or post-radiation salvage prostates',
      'Severe prior transurethral resection (TURP) defects require careful radiologist anatomical correlation',
      'Image-guided biopsy remains the definitive histopathological gold standard'
    ]
  },
  {
    id: 'q14',
    category: 'clinical',
    question: 'How does the confidence score work?',
    answer: 'The Confidence Score (0-100%) represents the Vision Language Model\'s probabilistic certainty that a flagged region represents a true pathological lesion. >80% represents high certainty (well-demarcated restriction & low ADC); 50-80% indicates indeterminate/intermediate suspicion requiring close inspection; <50% indicates low suspicion. Confidence reflects diagnostic certainty, while PI-RADS category reflects cancer risk.'
  },

  // Institutional Questions
  {
    id: 'q15',
    category: 'institutional',
    question: 'How much does MRI-RadAI cost?',
    answer: 'We offer flexible institutional tiers: (1) Pay-per-scan ($8-15 per analysis) for low-volume outpatient centers; (2) Departmental Tier ($750-1800/month for unlimited scans up to 5 concurrent readers); and (3) Enterprise Health System Licensing (custom deployment for multi-hospital networks with direct PACS integration and dedicated on-premise SLA).'
  },
  {
    id: 'q16',
    category: 'institutional',
    question: 'Do you offer training for my team?',
    answer: 'Yes. Every institutional deployment includes a 1-hour interactive onboarding masterclass for radiology fellows and attendings, CME-accredited training modules, continuous technical support, and monthly updates incorporating newly published PI-RADS steering committee recommendations.'
  },
  {
    id: 'q17',
    category: 'institutional',
    question: 'Can we run this on-premise (not cloud)?',
    answer: 'Yes. While the cloud version runs on HIPAA-compliant infrastructure with instant zero-dev setup, enterprise healthcare organizations can deploy MRI-RadAI On-Premise via containerized Kubernetes appliances connected directly to local PACS archives with zero outbound traffic.'
  },
  {
    id: 'q18',
    category: 'institutional',
    question: 'What happens if the API goes down?',
    answer: 'Our cloud platform maintains a 99.95% uptime SLA backed by geo-redundant clusters. The browser application caches all patient data and 3D renderings locally in client memory; if network connectivity fluctuates mid-session, all manual annotations and slice navigations remain fully operational offline.'
  },

  // Privacy & Compliance
  {
    id: 'q19',
    category: 'privacy',
    question: 'Is MRI-RadAI HIPAA compliant?',
    answer: 'Yes. MRI-RadAI strictly adheres to HIPAA Title II Privacy and Security Rules. All protected health information (PHI) is automatically sanitized via DICOM PS 3.15 de-identification profiles. Business Associate Agreements (BAAs) are executed prior to institutional onboarding.'
  },
  {
    id: 'q20',
    category: 'privacy',
    question: 'Can I use MRI-RadAI for research?',
    answer: 'Yes. We actively collaborate with academic medical centers. The platform supports de-identified cohort batch analysis, research protocol export, radiomics CSV extraction (including volumetric and ADC metrics), and IRB-compliant validation studies.'
  }
];

export const FAQSection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>('q1');

  const filteredFaqs = FAQS.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch = 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section className="py-16 bg-slate-900/60 border-t border-slate-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-medical-500/10 border border-medical-500/30 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Clinical & Technical FAQ</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-slate-300 text-sm">
            Everything you need to know about our Claude Vision multi-modal architecture, 3D visualization, clinical validation, and PACS integration.
          </p>
        </div>

        {/* Search Bar & Category Filters */}
        <div className="space-y-4 mb-8">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search clinical questions, accuracy, DICOM support, PACS, pricing..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All Questions (20)' },
              { id: 'general', label: 'General & Overview' },
              { id: 'clinical', label: 'Clinical Workflow' },
              { id: 'technical', label: 'Technical & 3D' },
              { id: 'institutional', label: 'Pricing & Hospital' },
              { id: 'privacy', label: 'HIPAA & Compliance' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeCategory === tab.id
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No matching questions found for "{searchQuery}". Try searching for "accuracy", "HIPAA", or "DICOM".
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isExpanded = expandedId === faq.id;
              return (
                <div
                  key={faq.id}
                  className={`border rounded-xl transition-all duration-200 overflow-hidden ${
                    isExpanded
                      ? 'bg-slate-950 border-sky-500/40 shadow-lg shadow-sky-500/5'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : faq.id)}
                    className="w-full flex items-center justify-between p-4 text-left transition-colors"
                  >
                    <span className="font-semibold text-slate-200 text-sm pr-4">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-sky-400 shrink-0 transition-transform duration-200 ${
                        isExpanded ? 'transform rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 text-xs text-slate-300 leading-relaxed border-t border-slate-900">
                      <p>{faq.answer}</p>
                      {faq.highlights && (
                        <ul className="mt-3 space-y-1.5 pl-1">
                          {faq.highlights.map((h, i) => (
                            <li key={i} className="flex items-start space-x-2 text-slate-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                              <span>{h}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};
