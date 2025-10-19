// frontend/src/components/prosthodontics/PartialCaseSheet.jsx
import React, { useState } from 'react';
import axios from 'axios';
import './PartialCaseSheet.css'; // We'll create this CSS file

const PartialCaseSheet = () => {
  const [currentSection, setCurrentSection] = useState('medical-history');
  const [formData, setFormData] = useState({
    // Patient Information
    patientId: '',
    patientName: '',
    doctorId: '',
    doctorName: '',
    
    // 1. Medical History
    cardio: '',
    resp: '',
    diabetes: '',
    blood: '',
    neuro: '',
    rheumatic: '',
    skin: '',
    bone: '',
    hep: '',
    immune: '',
    allergy: '',
    others_medical: '',
    treatment: '',
    
    // 2. General Examination
    gait: '',
    tuilt: '',
    weight: '',
    height: '',
    bp: '',
    resp_rate: '',
    heart_rate: '',
    temperature: '',
    
    // 3. Patient Information & Habits
    nutrition: '',
    attitude: [],
    habit: [],
    habit_duration: '',
    
    // 4. Dental History
    prev_treatment: '',
    loss_reason: [],
    max_anterior: '',
    max_posterior: '',
    mand_anterior: '',
    mand_posterior: '',
    duration_rulones: '',
    
    // 5. Clinical Examination - Extra Oral
    facial_symmetry: '',
    facial_profile: [],
    facial_form: [],
    mouth_opening: '',
    mandible_deviation: '',
    opening_deviation: [],
    closing_deviation: [],
    pain_tenderness: '',
    clicking: '',
    crepitus: '',
    lymph_nodes: '',
    lips: '',
    competency: '',
    lip_length: [],
    pathology: '',
    
    // 6. Intraoral Examination
    muscle_tone: '',
    buccal_colour: '',
    buccal_texture: '',
    buccal_others: '',
    floor_colour: '',
    floor_others: '',
    hard_shape: '',
    hard_tori: '',
    hard_hyperplasia: '',
    hard_inflammation: '',
    hard_others: '',
    soft_palate_form: '',
    soft_colour: '',
    soft_others: '',
    tongue_size: '',
    tongue_position: '',
    tongue_mobility: '',
    saliva_class: '',
    
    // 7. Gingival Index
    buccal_upper_distal: '',
    buccal_upper_mesial: '',
    palatal_upper_distal: '',
    palatal_upper_mesial: '',
    buccal_lower_distal: '',
    buccal_lower_mesial: '',
    lingual_lower_distal: '',
    lingual_lower_mesial: '',
    gingival_index: '',
    
    // 8. Oral Hygiene Index
    debris_16: '',
    debris_11: '',
    debris_26: '',
    debris_46: '',
    debris_31: '',
    debris_36: '',
    debris_score: '',
    calc_16: '',
    calc_11: '',
    calc_26: '',
    calc_46: '',
    calc_31: '',
    calc_36: '',
    calculus_score: '',
    debrisTotal: '',
    calculusTotal: '',
    ohis: '',
    
    // 9. DMF Index (simplified - you can expand this)
    dmf_notes: '',
    
    // 10. Periodontal Status
    periodontal_notes: '',
    other_periodontal_findings: '',
    
    // 11. Tooth Structure
    abrasion: '',
    attrition: '',
    erosion: '',
    abfraction: '',
    
    // 12. Edentulous Ridge
    mucosa_color: '',
    mucosa_consistency: '',
    mucosa_thickness: '',
    ridgeClass: [],
    ridgeHeight: '',
    ridgeLength: '',
    ridgeWidth: '',
    
    // 13. Occlusion
    molarRelation: '',
    occlusalPlane: '',
    drifting: '',
    supraEruption: '',
    rotation: '',
    overjet: '',
    overbite: '',
    scheme: [],
    occlusionOthers: '',
    
    // 14. Abutment Evaluation - Clinical
    clinical_crown_height: '',
    crown_morphology: '',
    vitality: '',
    mobility_abutment: '',
    probing_depth: '',
    bleeding_on_probing: '',
    recession_abutment: '',
    furcation_involvement: '',
    axial_inclination: '',
    rotations_abutment: '',
    pain_on_percussion: '',
    restorations: '',
    caries: '',
    supra_eruption_intrusion: '',
    
    // 15. Abutment Evaluation - Radiographic
    periapical_status: '',
    lamina_dura: '',
    crown_height_radio: '',
    root_length: '',
    bone_radio: '',
    crown_root_ratio: '',
    coronal_proximal_radiolucency: '',
    
    // 16. Other Investigations
    other_investigations: '',
    
    // 17. Treatment Planning
    kennedy_classification: '',
    treatment_surgery: '',
    treatment_endodontic: '',
    treatment_periodontal: '',
    treatment_orthodontic: '',
    
    // 18. Treatment Procedure
    treatment_procedures: Array(27).fill().map(() => ({
      date: '',
      grade: '',
      staff: ''
    })),
    
    // File uploads
    digitalSignature: null,
    maxillary_arch_design: null,
    mandibular_arch_design: null
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked 
          ? [...(prev[name] || []), value]
          : (prev[name] || []).filter(item => item !== value)
      }));
    } else if (type === 'radio') {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    } else if (type === 'file') {
      setFormData(prev => ({
        ...prev,
        [name]: e.target.files[0]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleProcedureChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      treatment_procedures: prev.treatment_procedures.map((proc, i) => 
        i === index ? { ...proc, [field]: value } : proc
      )
    }));
  };

  const calculateScores = () => {
    // Calculate Gingival Index
    const gingivalScores = [
      formData.buccal_upper_distal, formData.buccal_upper_mesial,
      formData.palatal_upper_distal, formData.palatal_upper_mesial,
      formData.buccal_lower_distal, formData.buccal_lower_mesial,
      formData.lingual_lower_distal, formData.lingual_lower_mesial
    ].filter(score => score !== '').map(Number);
    
    const gingivalIndex = gingivalScores.length > 0 
      ? (gingivalScores.reduce((a, b) => a + b) / gingivalScores.length).toFixed(2)
      : '';
    
    setFormData(prev => ({ ...prev, gingival_index: gingivalIndex }));

    // Calculate Debris Score
    const debrisScores = [
      formData.debris_16, formData.debris_11, formData.debris_26,
      formData.debris_46, formData.debris_31, formData.debris_36
    ].filter(score => score !== '').map(Number);
    
    const debrisScore = debrisScores.length > 0 
      ? (debrisScores.reduce((a, b) => a + b) / debrisScores.length).toFixed(2)
      : '';
    
    setFormData(prev => ({ ...prev, debris_score: debrisScore }));

    // Calculate Calculus Score
    const calculusScores = [
      formData.calc_16, formData.calc_11, formData.calc_26,
      formData.calc_46, formData.calc_31, formData.calc_36
    ].filter(score => score !== '').map(Number);
    
    const calculusScore = calculusScores.length > 0 
      ? (calculusScores.reduce((a, b) => a + b) / calculusScores.length).toFixed(2)
      : '';
    
    setFormData(prev => ({ ...prev, calculus_score: calculusScore }));

    // Calculate OHI-S
    const debrisTotal = parseFloat(formData.debrisTotal) || 0;
    const calculusTotal = parseFloat(formData.calculusTotal) || 0;
    const ohis = (debrisTotal + calculusTotal).toFixed(2);
    setFormData(prev => ({ ...prev, ohis }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      
      // Append all form data
      Object.keys(formData).forEach(key => {
        if (key === 'treatment_procedures') {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else if (key === 'digitalSignature' || key === 'maxillary_arch_design' || key === 'mandibular_arch_design') {
          if (formData[key]) {
            formDataToSend.append(key, formData[key]);
          }
        } else if (Array.isArray(formData[key])) {
          formDataToSend.append(key, formData[key].join(','));
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      const token = localStorage.getItem('token');
      const response = await axios.post('/api/prosthodontics/partial/save', formDataToSend, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        alert('Partial case sheet saved successfully!');
        console.log('Case ID:', response.data.caseId);
      }
    } catch (error) {
      console.error('Error saving partial case sheet:', error);
      alert('Error saving case sheet: ' + (error.response?.data?.message || error.message));
    }
  };

  const procedureNames = [
    "Diagnostic impression",
    "Preparation of diagnostic cast",
    "Surveying and designing of diagnostic cast",
    "Mouth preparation",
    "Definitive impression Material used",
    "Preparation of master cast",
    "Surveying and designing of master cast",
    "Block out procedure",
    "Duplication and refractory casts",
    "Preparation of refractory cast",
    "Wax pattern for frame work",
    "Casting of frame work",
    "Finishing and polishing of frame work",
    "Metal try in",
    "Altered cast impression",
    "Occlusal rim preparation",
    "Tentative jaw relation",
    "Facebow transfer",
    "Jaw relation recording",
    "Articulation of casts",
    "Teeth arrangement",
    "Wax try in",
    "Acrylization",
    "Finishing and polishing",
    "Denture delivery",
    "Post insertion follow up-1",
    "Post insertion follow up-2"
  ];

  const sections = [
    { id: 'medical-history', label: '1. Medical History' },
    { id: 'general-examination', label: '2. General Examination' },
    { id: 'patient-info', label: '3. Patient Information' },
    { id: 'dental-history', label: '4. Dental History' },
    { id: 'clinical-extraoral', label: '5. Clinical Examination' },
    { id: 'intraoral-examination', label: '6. Intraoral Examination' },
    { id: 'gingival-oral-hygiene', label: '7. Gingival & Oral Hygiene' },
    { id: 'periodontal-charting', label: '8. Periodontal Charting' },
    { id: 'tooth-structure-ridge', label: '9. Tooth Structure & Ridge' },
    { id: 'abutment-evaluation', label: '10. Abutment Evaluation' },
    { id: 'edentulous-classification', label: '11. Classification & Planning' },
    { id: 'treatment-procedure', label: '12. Treatment Procedure' }
  ];

  const renderSection = () => {
    switch (currentSection) {
      case 'medical-history':
        return (
          <div>
            <h2 id="medical-history">1. Medical History</h2>
            <p>Does the patient suffer/suffered from any of the following disease/s:</p>

            <div className="medical-history-conditions">
              {[
                { id: 'cardio', label: 'Cardiovascular disease' },
                { id: 'resp', label: 'Respiratory disorder' },
                { id: 'diabetes', label: 'Diabetes' },
                { id: 'blood', label: 'Blood dyscrasias' },
                { id: 'neuro', label: 'Neurological disease/facial palsy' },
                { id: 'rheumatic', label: 'Rheumatic fever' },
                { id: 'skin', label: 'Skin disorders' },
                { id: 'bone', label: 'Rheumatoid arthritis/bone disorders' },
                { id: 'hep', label: 'Hepatitis' },
                { id: 'immune', label: 'Immune disorders' },
                { id: 'allergy', label: 'Allergic reactions' },
                { id: 'others_medical', label: 'Others' }
              ].map(({ id, label }) => (
                <div key={id} className="condition-item">
                  <label htmlFor={`${id}_yes`}>{label}</label>
                  <input type="radio" id={`${id}_yes`} name={id} value="yes" onChange={handleChange} /> Yes
                  <input type="radio" id={`${id}_no`} name={id} value="no" onChange={handleChange} /> No
                </div>
              ))}
            </div>

            <div className="form-group">
              <label htmlFor="treatment">A. Details of treatment for any of the above said ailments:</label>
              <textarea id="treatment" name="treatment" rows="4" value={formData.treatment} onChange={handleChange} required />
            </div>
          </div>
        );

      case 'general-examination':
        return (
          <div>
            <h3>2. General Examination</h3>
            <div className="form-group">
              <label htmlFor="gait">Gait:</label>
              <input type="text" id="gait" name="gait" value={formData.gait} onChange={handleChange} />

              <label htmlFor="tuilt">Tuilt:</label>
              <input type="text" id="tuilt" name="tuilt" value={formData.tuilt} onChange={handleChange} />

              <label htmlFor="weight">Weight:</label>
              <input type="text" id="weight" name="weight" value={formData.weight} onChange={handleChange} />

              <label htmlFor="height">Height:</label>
              <input type="text" id="height" name="height" value={formData.height} onChange={handleChange} />
            </div>

            <h4>Vital Signs</h4>
            <div className="form-group">
              <label htmlFor="bp">Blood pressure:</label>
              <input type="text" id="bp" name="bp" value={formData.bp} onChange={handleChange} />

              <label htmlFor="resp_rate">Respiratory rate:</label>
              <input type="text" id="resp_rate" name="resp_rate" value={formData.resp_rate} onChange={handleChange} />

              <label htmlFor="heart_rate">Heart rate:</label>
              <input type="text" id="heart_rate" name="heart_rate" value={formData.heart_rate} onChange={handleChange} />

              <label htmlFor="temperature">Body temperature:</label>
              <input type="text" id="temperature" name="temperature" value={formData.temperature} onChange={handleChange} />
            </div>
          </div>
        );

      // Add more cases for other sections...

      case 'treatment-procedure':
        return (
          <div>
            <h2 id="treatment-procedure">18. Treatment Procedure</h2>
            <table>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Treatment Procedure</th>
                  <th>Date</th>
                  <th>Grade</th>
                  <th>Staff In Charge</th>
                </tr>
              </thead>
              <tbody>
                {procedureNames.map((procedure, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{procedure}</td>
                    <td>
                      <input 
                        type="text" 
                        value={formData.treatment_procedures[index].date}
                        onChange={(e) => handleProcedureChange(index, 'date', e.target.value)}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        value={formData.treatment_procedures[index].grade}
                        onChange={(e) => handleProcedureChange(index, 'grade', e.target.value)}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        value={formData.treatment_procedures[index].staff}
                        onChange={(e) => handleProcedureChange(index, 'staff', e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="form-group">
              <label htmlFor="digitalSignature">Digital Signature:</label>
              <input type="file" id="digitalSignature" name="digitalSignature" onChange={handleChange} accept="image/*" />
            </div>
          </div>
        );

      default:
        return <div>Section not found</div>;
    }
  };

  return (
    <div className="partial-case-sheet">
      <div className="logo-container">
        <img src="logo.png" alt="SRM Dental College Logo" />
      </div>
      <h1>Partial Denture Case Sheet - Prosthodontics Department</h1>

      {/* Navigation Menu */}
      <nav className="navigation-menu">
        {sections.map(section => (
          <a 
            key={section.id}
            href={`#${section.id}`}
            className={currentSection === section.id ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault();
              setCurrentSection(section.id);
            }}
          >
            {section.label}
          </a>
        ))}
      </nav>

      <form onSubmit={handleSubmit}>
        {renderSection()}

        <div className="form-navigation">
          <button 
            type="button" 
            onClick={() => {
              const currentIndex = sections.findIndex(s => s.id === currentSection);
              if (currentIndex > 0) {
                setCurrentSection(sections[currentIndex - 1].id);
              }
            }}
            disabled={currentSection === sections[0].id}
          >
            Previous
          </button>

          <button 
            type="button" 
            onClick={() => {
              const currentIndex = sections.findIndex(s => s.id === currentSection);
              if (currentIndex < sections.length - 1) {
                setCurrentSection(sections[currentIndex + 1].id);
              }
            }}
            disabled={currentSection === sections[sections.length - 1].id}
          >
            Next
          </button>

          {currentSection === sections[sections.length - 1].id && (
            <button type="submit" className="submit-btn">
              Submit Case Sheet
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default PartialCaseSheet;