// server/models/Prescription.js - Fixed version
import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Medicine type is required'],
    enum: {
      values: ['injection', 'syrup', 'pills', 'ointment'],
      message: 'Medicine type must be one of: injection, syrup, pills, ointment'
    }
  },
  name: {
    type: String,
    required: [true, 'Medicine name is required'],
    trim: true,
    maxlength: [200, 'Medicine name cannot exceed 200 characters']
  },
  dosage: {
    m: {
      type: String,
      default: '0',
      enum: ['0', '1/4', '1/2', '1', '2']
    }, // Morning
    n: {
      type: String,
      default: '0',
      enum: ['0', '1/4', '1/2', '1', '2']
    }, // Noon
    e: {
      type: String,
      default: '0',
      enum: ['0', '1/4', '1/2', '1', '2']
    }, // Evening
    n2: {
      type: String,
      default: '0',
      enum: ['0', '1/4', '1/2', '1', '2']
    } // Night
  },
  foodIntake: {
    type: String,
    enum: {
      values: ['after', 'before'],
      message: 'Food intake must be either "after" or "before"'
    },
    default: 'after'
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [0, 'Duration cannot be negative'],
    max: [365, 'Duration cannot exceed 365 days']
  },
  // Remove durationType from schema - handle in application logic
  asNeeded: {
    type: Boolean,
    default: false
  }
}, {
  _id: true,
  timestamps: false
});

const prescriptionSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: [true, 'Patient ID is required'],
    trim: true,
    index: true
  },
  patientData: {
    name: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
      maxlength: [100, 'Patient name cannot exceed 100 characters']
    },
    age: {
      type: Number,
      required: [true, 'Patient age is required'],
      min: [0, 'Age cannot be negative'],
      max: [150, 'Age cannot exceed 150']
    },
    gender: {
      type: String,
      required: [true, 'Patient gender is required'],
      enum: {
        values: ['male', 'female', 'other'],
        message: 'Gender must be one of: male, female, other'
      }
    },
    date: {
      type: Date,
      required: [true, 'Prescription date is required'],
      default: Date.now
    }
  },
  symptoms: {
    type: String,
    required: [true, 'Symptoms are required'],
    trim: true,
    maxlength: [1000, 'Symptoms cannot exceed 1000 characters']
  },
  diagnosis: {
    type: String,
    required: [true, 'Diagnosis is required'],
    trim: true,
    maxlength: [1000, 'Diagnosis cannot exceed 1000 characters']
  },
  medicines: {
    type: [medicineSchema],
    validate: {
      validator: function (medicines) {
        return medicines && medicines.length > 0;
      },
      message: 'At least one medicine is required'
    }
  },
  advice: {
    type: String,
    default: '',
    trim: true,
    maxlength: [1000, 'Advice cannot exceed 1000 characters']
  },
  nextVisitDate: {
    type: Date,
    default: null
  },
  doctorId: {
    type: String,
    required: [true, 'Doctor ID is required'],
    trim: true,
    index: true
  },
  doctorName: {
    type: String,
    required: [true, 'Doctor name is required'],
    trim: true,
    maxlength: [100, 'Doctor name cannot exceed 100 characters']
  },
  clinicName: {
    type: String,
    default: 'SRM Dental College',
    trim: true,
    maxlength: [200, 'Clinic name cannot exceed 200 characters']
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'completed', 'cancelled'],
      message: 'Status must be one of: active, completed, cancelled'
    },
    default: 'active',
    index: true
  },
  billing: {
    isGenerated: {
      type: Boolean,
      default: false,
      index: true
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: [0, 'Total amount cannot be negative']
    },
    billingDate: {
      type: Date,
      default: null
    },
    items: [{
      medicineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medicine'
      },
      medicineName: String,
      medicineType: String,
      quantity: Number,
      unitPrice: Number,
      totalPrice: Number,
      dosage: String,
      foodIntake: String,
      duration: Number
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
prescriptionSchema.index({ patientId: 1, createdAt: -1 });
prescriptionSchema.index({ doctorId: 1, createdAt: -1 });
prescriptionSchema.index({ 'billing.isGenerated': 1, status: 1 });
prescriptionSchema.index({ createdAt: -1 });

// Pre-save middleware with better error handling
prescriptionSchema.pre('save', function (next) {
  try {
    console.log('Pre-save middleware executing for prescription:', this._id);

    // Validate that injections have correct duration
    this.medicines.forEach(medicine => {
      if (medicine.type === 'injection') {
        medicine.duration = 1; // Always 1 for injections
        medicine.dosage.m = '1';
        medicine.dosage.n = '0';
        medicine.dosage.e = '0';
        medicine.dosage.n2 = '0';
      }
    });

    console.log('Pre-save validation completed successfully');
    next();
  } catch (error) {
    console.error('Pre-save middleware error:', error);
    next(error);
  }
});

// Post-save middleware for logging
prescriptionSchema.post('save', function (doc, next) {
  console.log('Prescription saved successfully with ID:', doc._id);
  next();
});

// Error handling middleware
prescriptionSchema.post('save', function (error, doc, next) {
  console.error('Post-save error middleware triggered:', error);
  if (error.name === 'MongoServerError' && error.code === 11000) {
    next(new Error('Duplicate prescription detected'));
  } else {
    next(error);
  }
});

export default mongoose.model('Prescription', prescriptionSchema);