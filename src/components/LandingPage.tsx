import React, { useState } from 'react';
import {
  Activity, ArrowDown, ArrowRight, ArrowUpRight, BadgeCheck, Box, Brain,
  Check, ChevronDown, CircleDot, ClipboardCheck, FileDown, Layers3,
  ScanLine, Shield, Sparkles, Stethoscope, Workflow,
} from 'lucide-react';

interface LandingPageProps {
  onNavigateToUpload: () => void;
  onOpenQuickDemo: () => void;
}

const steps = [
  { number: '01', title: 'Choose a case', detail: 'Start with a sample case or explore the local upload workflow.', icon: ScanLine },
  { number: '02', title: 'Review in context', detail: 'Move between synthetic 2D slices and a rotatable 3D anatomy view.', icon: Box },
  { number: '03', title: 'Make the call', detail: 'Select findings, add ROI annotations, and record your review.', icon: ClipboardCheck },
  { number: '04', title: 'Share the report', detail: 'Export a case summary as a PDF or lesion metrics as a CSV.', icon: FileDown },
];

const capabilities = [
  { icon: Layers3, number: '01', title: 'A clearer spatial picture', detail: 'Explore a procedural prostate model, select lesion markers, and relate them to the surrounding anatomy.' },
  { icon: ScanLine, number: '02', title: 'A familiar reading rhythm', detail: 'Browse axial, sagittal, and coronal views, change sequence styling, and step or play through slices.' },
  { icon: Brain, number: '03', title: 'Findings with a rationale', detail: 'Review sample lesion characteristics, PI-RADS scores, measurements, and written case explanations together.' },
  { icon: Stethoscope, number: '04', title: 'Clinician stays in control', detail: 'Approve, reject, or modify a finding, add a manual ROI, and mark a case as signed off.' },
];

const faqs = [
  { q: 'What is MRI-RadAI?', a: 'MRI-RadAI is a front-end prototype for a prostate MRI review workflow. It demonstrates a worklist, sample cases, interactive 2D and 3D views, radiologist feedback, and report exports.' },
  { q: 'Can I analyze a real MRI scan here?', a: 'The current upload screen demonstrates file selection and a guided progress flow. It does not parse DICOM studies or run an AI model; the analysis view uses one of the included sample cases.' },
  { q: 'Are the images and measurements from real scans?', a: 'No. The viewer draws procedural example graphics and displays bundled sample case values. They are for product demonstration only, not clinical interpretation.' },
  { q: 'Does this connect to PACS or Claude?', a: 'No. PACS, DICOMweb, authentication, and model inference are not connected in this prototype. The settings screen is a UI demonstration.' },
  { q: 'Who is the product designed for?', a: 'The experience is designed around radiologists and clinical teams who review prostate MRI: it keeps findings, anatomy, case context, and review actions close together.' },
  { q: 'Can the output be used for patient care?', a: 'No. This prototype is not a diagnostic device and its sample content must not be used for patient care. Clinical decisions require qualified review of the original imaging and patient context.' },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="landing-kicker"><span className="landing-kicker-dot" />{children}</div>;
}

function ProductPreview() {
  return (
    <div className="landing-preview-wrap" aria-label="Illustration of the MRI-RadAI review workspace">
      <div className="landing-preview-glow" />
      <div className="landing-preview">
        <div className="preview-topbar">
          <div className="flex items-center gap-2"><span className="preview-mark"><Activity size={14} /></span><span className="preview-title">Review workspace</span></div>
          <span className="preview-chip"><span /> DEMO CASE</span>
        </div>
        <div className="preview-patient"><div><span className="preview-eyebrow">CASE OVERVIEW</span><strong>Prostate MRI <i>·</i> PX-4092</strong></div><span className="preview-pirads">PI-RADS <b>5</b></span></div>
        <div className="preview-grid">
          <div className="preview-mri">
            <div className="mri-corner">T2 AXIAL <span>14 / 28</span></div>
            <svg className="mri-drawing" viewBox="0 0 280 230" role="img" aria-label="Stylized synthetic MRI slice">
              <defs>
                <radialGradient id="gland" cx="48%" cy="47%" r="54%"><stop offset="0" stopColor="#879a91"/><stop offset=".48" stopColor="#5d706c"/><stop offset=".78" stopColor="#334845"/><stop offset="1" stopColor="#172a28"/></radialGradient>
                <radialGradient id="body" cx="50%" cy="48%" r="65%"><stop offset="0" stopColor="#34413f"/><stop offset="1" stopColor="#111c1b"/></radialGradient>
                <filter id="blur"><feGaussianBlur stdDeviation="7" /></filter>
              </defs>
              <ellipse cx="140" cy="116" rx="119" ry="97" fill="url(#body)" stroke="#64736d" strokeOpacity=".2" />
              <ellipse cx="140" cy="116" rx="70" ry="56" fill="url(#gland)" stroke="#a7b8a9" strokeOpacity=".5" strokeWidth="2" />
              <ellipse cx="140" cy="116" rx="28" ry="32" fill="#283c38" stroke="#9baa9a" strokeOpacity=".4" />
              <path d="M86 117c21-24 40-31 56-28 20 2 35 18 51 39-23 21-43 30-61 25-18-4-31-17-46-36Z" fill="#d88b65" opacity=".17" filter="url(#blur)" />
              <ellipse cx="105" cy="108" rx="10" ry="8" fill="#df9b71" opacity=".86" stroke="#ffd0a7" strokeWidth="1.5" />
              <circle cx="105" cy="108" r="20" fill="none" stroke="#e4ac83" strokeOpacity=".5" strokeDasharray="3 4" />
              <path d="M25 116h230M140 20v192" stroke="#c4d0bb" strokeOpacity=".17" strokeDasharray="4 5" />
              <circle cx="140" cy="116" r="2" fill="#e8e7d9" />
            </svg>
            <div className="mri-scale"><span>R</span><span>— 20 mm —</span><span>L</span></div>
          </div>
          <div className="preview-model">
            <div className="mri-corner">3D ANATOMY <span>ROTATE</span></div>
            <svg viewBox="0 0 190 230" className="anatomy-drawing" role="img" aria-label="Stylized prostate anatomy model">
              <defs><radialGradient id="organ" cx="35%" cy="28%" r="80%"><stop offset="0" stopColor="#c6ad8d"/><stop offset=".5" stopColor="#84745e"/><stop offset="1" stopColor="#50483f"/></radialGradient><linearGradient id="zone" x2="1" y2="1"><stop stopColor="#a5c7ad"/><stop offset="1" stopColor="#537b70"/></linearGradient></defs>
              <path d="M91 26c-22 4-35 23-33 50-18 20-30 52-22 81 6 24 24 39 48 37 9 12 25 16 39 7 24 4 44-12 48-38 5-29-7-59-26-80 0-32-17-53-40-57-5-6-9-7-14 0Z" fill="url(#organ)" stroke="#d6c5a7" strokeOpacity=".64" strokeWidth="1.5" />
              <path d="M90 51c-17 2-27 17-27 36-13 17-20 39-13 58 5 15 17 24 31 20 9 7 22 8 31 1 16 2 28-8 31-24 4-20-4-41-17-55-1-22-12-35-26-37-4-3-7-3-10 1Z" fill="url(#zone)" opacity=".83" />
              <path d="M94 61c-2 20 4 38 1 58-2 17 1 29 4 42" fill="none" stroke="#d1c4a9" strokeWidth="7" strokeLinecap="round" opacity=".8" />
              <path d="M68 101c15-8 21-10 29-8 10 2 18 10 24 20-11 13-23 20-35 18-10-2-16-11-18-30Z" fill="#d88b65" stroke="#f4c0a1" strokeWidth="1.5" />
              <circle cx="82" cy="111" r="15" fill="none" stroke="#f4c0a1" strokeDasharray="2 3" />
              <path d="M18 110h35" stroke="#d6c5a7" strokeOpacity=".55" /><text x="10" y="104" fill="#ddc8ad" fontSize="8" fontFamily="monospace">PZ</text>
              <path d="M104 72h39" stroke="#d6c5a7" strokeOpacity=".55" /><text x="146" y="75" fill="#ddc8ad" fontSize="8" fontFamily="monospace">TZ</text>
            </svg>
            <div className="model-legend"><span><i className="legend-lesion" /> Selected finding</span><span><i className="legend-zone" /> Anatomy</span></div>
          </div>
        </div>
        <div className="preview-bottom">
          <div className="preview-finding"><span className="finding-dot" /><div><span>SELECTED FINDING</span><strong>Target lesion · Mid-gland PZ</strong></div></div>
          <div className="preview-measure"><span>SIZE</span><strong>16.4 × 12.1 <small>mm</small></strong></div>
          <div className="preview-measure"><span>CONFIDENCE</span><strong>96<small>%</small></strong></div>
          <div className="preview-measure"><span>ADC</span><strong>0.64 <small>×10⁻³</small></strong></div>
        </div>
        <div className="preview-footnote"><Shield size={12} /> Illustrative interface · Sample case data</div>
      </div>
      <div className="preview-float"><span className="float-icon"><BadgeCheck size={16} /></span><span><b>Radiologist-led</b><small>Review and sign-off</small></span></div>
    </div>
  );
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToUpload, onOpenQuickDemo }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="landing-page">
      <section className="landing-hero" id="top">
        <div className="landing-grain" />
        <div className="landing-container landing-hero-grid">
          <div className="landing-hero-copy">
            <SectionLabel>PROSTATE MRI · CLINICAL DECISION SUPPORT</SectionLabel>
            <h1>Read the finding.<br /><span>See where it lives.</span></h1>
            <p className="landing-lede">A more connected way to review prostate MRI findings—bringing lesion details, slice views, and 3D anatomy into one clinician-led workspace.</p>
            <div className="landing-actions">
              <button className="landing-button landing-button-primary" onClick={onOpenQuickDemo}>Explore a sample case <ArrowRight size={16} /></button>
              <button className="landing-button landing-button-secondary" onClick={onNavigateToUpload}>Open the upload demo <ArrowUpRight size={15} /></button>
            </div>
            <div className="landing-hero-note"><span className="note-rule" />Prototype experience using sample data. Not for clinical diagnosis.</div>
          </div>
          <ProductPreview />
        </div>
        <div className="landing-container landing-hero-bottom"><span>BUILT AROUND THE READING WORKFLOW</span><div><span><Layers3 size={15} /> Spatial context</span><span><ScanLine size={15} /> Multi-planar review</span><span><Stethoscope size={15} /> Clinician in control</span></div></div>
      </section>

      <section className="landing-problem landing-section">
        <div className="landing-container problem-grid">
          <div><SectionLabel>THE CHALLENGE</SectionLabel><h2>Good reads need more than a highlighted spot.</h2></div>
          <div className="problem-copy"><p>Prostate MRI review asks clinicians to reconcile multiple sequences, assess subtle findings, and keep their spatial orientation across slices.</p><p>When lesion details and anatomy are separated across tools, building a coherent picture takes extra mental effort.</p><div className="problem-pullquote">“Bring the finding, its context, and the review decision into the same frame.”</div></div>
        </div>
      </section>

      <section id="features" className="landing-section landing-features">
        <div className="landing-container">
          <div className="section-heading"><SectionLabel>ONE WORKSPACE, FOUR LENSES</SectionLabel><h2>From signal to spatial context.</h2><p>Designed to make each part of a case easier to inspect and discuss.</p></div>
          <div className="capability-grid">{capabilities.map(({ icon: Icon, number, title, detail }) => <article className="capability-card" key={number}><div className="capability-top"><span>{number}</span><Icon size={19} strokeWidth={1.5} /></div><h3>{title}</h3><p>{detail}</p><span className="capability-line" /></article>)}</div>
        </div>
      </section>

      <section id="how-it-works" className="landing-section landing-workflow">
        <div className="landing-container workflow-grid">
          <div className="workflow-intro"><SectionLabel>A SIMPLE REVIEW LOOP</SectionLabel><h2>One case.<br /><span>A connected view.</span></h2><p>Move from case context to anatomy, then capture the clinician’s review and export a clear summary.</p><button className="landing-text-link" onClick={onOpenQuickDemo}>Walk through a sample case <ArrowRight size={15} /></button></div>
          <div className="workflow-steps">{steps.map(({ number, title, detail, icon: Icon }) => <div className="workflow-step" key={number}><span className="workflow-number">{number}</span><span className="workflow-icon"><Icon size={17} /></span><div><h3>{title}</h3><p>{detail}</p></div><ArrowDown className="workflow-arrow" size={15} /></div>)}</div>
        </div>
      </section>

      <section className="landing-audience landing-section">
        <div className="landing-container audience-panel"><div className="audience-main"><SectionLabel>WHY IT’S USEFUL</SectionLabel><h2>Less switching.<br /><span>More seeing.</span></h2><p>For radiologists and clinical teams, the value is a calmer review surface: findings sit beside their imaging context, anatomy, notes, and next action.</p><div className="audience-checks"><span><Check size={15} /> Keep lesion details close to the slice</span><span><Check size={15} /> Orient findings in a 3D view</span><span><Check size={15} /> Capture review decisions in context</span></div></div><div className="audience-aside"><div className="aside-icon"><Sparkles size={18} /></div><p>One line</p><blockquote>“A prostate MRI review workspace that connects the finding to the anatomy—and keeps the clinician in control.”</blockquote><span>MRI-RadAI · PRODUCT PRINCIPLE</span></div></div>
      </section>

      <section className="landing-section landing-faq" id="faq"><div className="landing-container faq-grid"><div className="faq-intro"><SectionLabel>GOOD TO KNOW</SectionLabel><h2>Questions, answered plainly.</h2><p>Clear expectations about what this prototype demonstrates today.</p><div className="faq-icon"><CircleDot size={21} /></div></div><div className="faq-list">{faqs.map(({ q, a }, i) => <div className={`faq-item ${openFaq === i ? 'is-open' : ''}`} key={q}><button aria-expanded={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? null : i)}><span>{q}</span><ChevronDown size={17} /></button>{openFaq === i && <p>{a}</p>}</div>)}</div></div></section>

      <section className="landing-final-cta"><div className="landing-container final-cta-inner"><div><SectionLabel>TAKE A CLOSER LOOK</SectionLabel><h2>Explore the workflow.<br /><span>See the case in context.</span></h2><p>Try the sample experience and move through the review workspace at your own pace.</p></div><button className="landing-button landing-button-light" onClick={onOpenQuickDemo}>Open the sample case <ArrowRight size={16} /></button><div className="final-orbit orbit-one" /><div className="final-orbit orbit-two" /></div></section>

      <footer className="landing-disclaimer"><div className="landing-container"><span><Shield size={14} /> Product prototype</span><p>MRI-RadAI is a demonstration interface. It uses sample data and synthetic viewer graphics; it is not connected to a diagnostic AI model, PACS, or clinical records. Not for patient care.</p><a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Back to top ↑</a></div></footer>
    </div>
  );
};
