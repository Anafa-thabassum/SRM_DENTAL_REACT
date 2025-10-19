// server/models/prosthodontics/PartialCase.js
import mongoose from 'mongoose';

const PartialCaseSchema = new mongoose.Schema({
  // Patient and Doctor Information
  patientId: { type: String, required: true },
  patientName: String,
  doctorId: { type: String, required: true },
  doctorName: String,

  // 1. Medical History
  medicalHistory: {
    cardio: String,
    resp: String,
    diabetes: String,
    blood: String,
    neuro: String,
    rheumatic: String,
    skin: String,
    bone: String,
    hep: String,
    immune: String,
    allergy: String,
    others_medical: String,
    treatment: String
  },

  // 2. General Examination
  generalExamination: {
    gait: String,
    tuilt: String,
    weight: String,
    height: String,
    vitalSigns: {
      bp: String,
      respRate: String,
      heartRate: String,
      temperature: String
    }
  },

  // 3. Patient Information
  patientInfo: {
    nutrition: String,
    attitude: [String],
    habits: [String],
    habitDuration: String
  },

  // 4. Dental History
  dentalHistory: {
    prevTreatment: String,
    lossReason: [String],
    maxAnterior: String,
    maxPosterior: String,
    mandAnterior: String,
    mandPosterior: String,
    durationRulones: String
  },

  // 5. Clinical Examination - Extra Oral
  clinicalExamination: {
    facialSymmetry: String,
    facialProfile: [String],
    facialForm: [String],
    
    // TMJ Examination
    tmj: {
      maxMouthOpening: String,
      deviationMandible: String,
      openingDeviation: [String],
      closingDeviation: [String],
      painTenderness: String,
      clicking: String,
      crepitus: String,
      lymphNodes: String
    },
    
    lips: {
      condition: String,
      competency: String,
      lipLength: [String],
      pathology: String
    }
  },

  // 6. Intraoral Examination
  intraoralExamination: {
    muscleTone: String,
    
    buccalMucosa: {
      colour: String,
      texture: String,
      others: String
    },
    
    floorOfMouth: {
      colour: String,
      others: String
    },
    
    hardPalate: {
      shape: String,
      tori: String,
      hyperplasia: String,
      inflammation: String,
      others: String
    },
    
    softPalate: {
      form: String,
      colour: String,
      others: String
    },
    
    tongue: {
      size: String,
      position: String,
      mobility: String,
      others: String
    },
    
    saliva: String
  },

  // 7. Gingival Index (Loe and Silness)
  gingivalIndex: {
    upperBuccalDistal: Number,
    upperBuccalMesial: Number,
    upperPalatalDistal: Number,
    upperPalatalMesial: Number,
    lowerBuccalDistal: Number,
    lowerBuccalMesial: Number,
    lowerLingualDistal: Number,
    lowerLingualMesial: Number,
    calculatedIndex: Number
  },

  // 8. Oral Hygiene Index - Simplified (Green and Vermillion)
  oralHygieneIndex: {
    debrisScores: {
      tooth16: Number,
      tooth11: Number,
      tooth26: Number,
      tooth46: Number,
      tooth31: Number,
      tooth36: Number
    },
    calculusScores: {
      tooth16: Number,
      tooth11: Number,
      tooth26: Number,
      tooth46: Number,
      tooth31: Number,
      tooth36: Number
    },
    debrisScore: Number,
    calculusScore: Number,
    ohis: Number
  },

  // 9. DMF Index
  dmfIndex: {
    maxillary: Map,
    mandibular: Map
  },

  // 10. Periodontal Status
  periodontalStatus: {
    mobility: {
      maxillary: Map,
      mandibular: Map
    },
    furcation: {
      maxillary: Map,
      mandibular: Map
    },
    recession: {
      maxillary: Map,
      mandibular: Map
    },
    pockets: {
      maxillary: Map,
      mandibular: Map
    },
    otherFindings: String
  },

  // 11. Loss of Tooth Structure
  toothStructure: {
    abrasion: String,
    attrition: String,
    erosion: String,
    abfraction: String
  },

  // 12. Edentulous Ridge Status
  edentulousRidge: {
    mucosa: {
      colour: String,
      consistency: String,
      thickness: String
    },
    ridgeClassification: [String],
    height: String,
    length: String,
    width: String
  },

  // 13. Occlusion
  occlusion: {
    molarRelation: String,
    occlusalPlane: String,
    drifting: String,
    supraEruption: String,
    rotation: String,
    overjet: String,
    overbite: String,
    existingScheme: [String],
    others: String
  },

  // 14. Abutment Evaluation
  abutmentEvaluation: {
    clinical: {
      clinicalCrownHeight: String,
      crownMorphology: String,
      vitality: String,
      mobility: String,
      probingDepth: String,
      bleedingOnProbing: String,
      recession: String,
      furcationInvolvement: String,
      axialInclination: String,
      rotations: String,
      painOnPercussion: String,
      restorations: String,
      caries: String,
      supraEruptionIntrusion: String
    },
    radiographic: {
      periapicalStatus: String,
      laminaDura: String,
      crownHeight: String,
      rootLength: String,
      bone: String,
      crownRootRatio: String,
      coronalProximalRadiolucency: String
    }
  },

  // 15. Other Investigations
  otherInvestigations: String,

  // 16. Classification & Treatment Planning
  classificationAndPlanning: {
    kennedyClassification: String,
    surgery: String,
    endodontic: String,
    periodontal: String,
    orthodontic: String
  },

  // 17. Treatment Procedure
  treatmentProcedures: [{
    procedure: String,
    date: String,
    grade: String,
    staffInCharge: String
  }],

  // File Uploads
  maxillaryArchDesign: {
    data: Buffer,
    contentType: String,
    fileName: String
  },
  mandibularArchDesign: {
    data: Buffer,
    contentType: String,
    fileName: String
  },

  // Approval System
  chiefApproval: { type: String, default: "" },
  approvedBy: String,
  approvedAt: Date,
  digitalSignature: {
    data: Buffer,
    contentType: String,
    fileName: String
  },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('PartialCase', PartialCaseSchema);