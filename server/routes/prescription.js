// server/routes/prescription.js - Enhanced with debugging
import express from 'express';
import Prescription from '../models/Prescription.js';

const router = express.Router();

// Test endpoint - MUST come before parameterized routes
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Prescription routes are working!',
    timestamp: new Date().toISOString()
  });
});

// Create new prescription - Enhanced with detailed logging and validation
router.post('/', async (req, res) => {
  console.log('\n=== PRESCRIPTION CREATION START ===');
  console.log('Raw request body:', JSON.stringify(req.body, null, 2));

  try {
    const {
      patientId,
      patientData,
      symptoms,
      diagnosis,
      medicines,
      advice,
      nextVisitDate,
      doctorId,
      doctorName
    } = req.body;

    console.log('Extracted fields:');
    console.log('- patientId:', patientId);
    console.log('- patientData:', patientData);
    console.log('- symptoms:', symptoms);
    console.log('- diagnosis:', diagnosis);
    console.log('- medicines:', medicines);
    console.log('- doctorId:', doctorId);
    console.log('- doctorName:', doctorName);

    // Detailed validation with specific error messages
    const errors = [];

    if (!patientId || typeof patientId !== 'string' || !patientId.trim()) {
      errors.push('Patient ID is required and must be a non-empty string');
    }

    if (!symptoms || typeof symptoms !== 'string' || !symptoms.trim()) {
      errors.push('Symptoms are required and must be a non-empty string');
    }

    if (!diagnosis || typeof diagnosis !== 'string' || !diagnosis.trim()) {
      errors.push('Diagnosis is required and must be a non-empty string');
    }

    if (!doctorId || typeof doctorId !== 'string' || !doctorId.trim()) {
      errors.push('Doctor ID is required and must be a non-empty string');
    }

    if (!doctorName || typeof doctorName !== 'string' || !doctorName.trim()) {
      errors.push('Doctor name is required and must be a non-empty string');
    }

    if (!patientData || typeof patientData !== 'object') {
      errors.push('Patient data is required and must be an object');
    } else {
      if (!patientData.name || typeof patientData.name !== 'string' || !patientData.name.trim()) {
        errors.push('Patient name is required in patientData');
      }
      if (!patientData.age || isNaN(parseInt(patientData.age))) {
        errors.push('Patient age is required and must be a number');
      }
      if (!patientData.gender || !['male', 'female', 'other'].includes(patientData.gender.toLowerCase())) {
        errors.push('Patient gender must be male, female, or other');
      }
    }

    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
      errors.push('At least one medicine is required');
    } else {
      medicines.forEach((med, index) => {
        if (!med.type || !['injection', 'syrup', 'pills', 'ointment'].includes(med.type)) {
          errors.push(`Medicine ${index + 1}: Invalid type. Must be injection, syrup, pills, or ointment`);
        }
        if (!med.name || typeof med.name !== 'string' || !med.name.trim()) {
          errors.push(`Medicine ${index + 1}: Name is required`);
        }
        if (med.type !== 'injection' && (!med.duration || isNaN(parseInt(med.duration)))) {
          errors.push(`Medicine ${index + 1}: Duration is required for non-injection medicines`);
        }
      });
    }

    if (errors.length > 0) {
      console.log('Validation errors:', errors);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }

    // Create prescription with validated and processed data
    const prescriptionData = {
      patientId: patientId.trim(),
      patientData: {
        name: patientData.name.trim(),
        age: parseInt(patientData.age),
        gender: patientData.gender.toLowerCase(),
        date: patientData.date ? new Date(patientData.date) : new Date()
      },
      symptoms: symptoms.trim(),
      diagnosis: diagnosis.trim(),
      medicines: medicines
        .filter(med => med && med.type && med.name) // Filter out invalid medicines
        .map(med => {
          const processedMedicine = {
            type: med.type,
            name: med.name.trim(),
            dosage: {
              m: med.dosage?.m || '0',
              n: med.dosage?.n || '0',
              e: med.dosage?.e || '0',
              n2: med.dosage?.n2 || '0'
            },
            foodIntake: med.foodIntake || 'after',
            asNeeded: Boolean(med.asNeeded)
          };

          // Handle duration based on medicine type
          if (med.type === 'injection') {
            processedMedicine.duration = 1;
            processedMedicine.dosage.m = '1';
            processedMedicine.dosage.n = '0';
            processedMedicine.dosage.e = '0';
            processedMedicine.dosage.n2 = '0';
          } else {
            processedMedicine.duration = parseInt(med.duration) || 0;
          }

          return processedMedicine;
        }),
      advice: advice ? advice.trim() : '',
      nextVisitDate: nextVisitDate ? new Date(nextVisitDate) : null,
      doctorId: doctorId.trim(),
      doctorName: doctorName.trim(),
      status: 'active'
    };

    console.log('Processed prescription data:');
    console.log(JSON.stringify(prescriptionData, null, 2));

    // Create and save prescription
    console.log('Creating new Prescription instance...');
    const prescription = new Prescription(prescriptionData);

    console.log('Calling save()...');
    const savedPrescription = await prescription.save();

    console.log('Prescription saved successfully!');
    console.log('Saved prescription ID:', savedPrescription._id);
    console.log('=== PRESCRIPTION CREATION END ===\n');

    res.status(201).json({
      success: true,
      message: 'Prescription saved successfully',
      data: savedPrescription
    });

  } catch (error) {
    console.error('\n=== PRESCRIPTION CREATION ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      console.error('Validation errors:', validationErrors);
      console.error('=== END ERROR ===\n');

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors,
        field_errors: error.errors
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      console.error('Duplicate key error:', error.keyPattern);
      console.error('=== END ERROR ===\n');

      return res.status(400).json({
        success: false,
        message: 'Duplicate prescription detected',
        duplicate_field: error.keyPattern
      });
    }

    // Handle MongoDB connection errors
    if (error.name === 'MongoNetworkError' || error.name === 'MongoServerError') {
      console.error('Database connection error');
      console.error('=== END ERROR ===\n');

      return res.status(503).json({
        success: false,
        message: 'Database connection error. Please try again.',
        error_type: 'database_error'
      });
    }

    console.error('=== END ERROR ===\n');

    // Generic server error
    res.status(500).json({
      success: false,
      message: 'Failed to save prescription. Please try again.',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack,
        type: error.constructor.name
      } : 'Internal server error'
    });
  }
});

// Get prescriptions by patient ID
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    console.log(`Fetching prescriptions for patient: ${patientId}`);

    const prescriptions = await Prescription.find({ patientId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Prescription.countDocuments({ patientId });

    console.log(`Found ${prescriptions.length} prescriptions for patient ${patientId}`);

    res.json({
      success: true,
      data: prescriptions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching patient prescriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prescriptions',
      error: error.message
    });
  }
});

// Get prescription by ID
router.get('/:prescriptionId', async (req, res) => {
  try {
    const { prescriptionId } = req.params;

    if (!prescriptionId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid prescription ID format'
      });
    }

    const prescription = await Prescription.findById(prescriptionId);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    res.json({
      success: true,
      data: prescription
    });
  } catch (error) {
    console.error('Error fetching prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prescription',
      error: error.message
    });
  }
});

// Debug endpoint to test database connection
router.get('/debug/db-test', async (req, res) => {
  try {
    const count = await Prescription.countDocuments();
    const sample = await Prescription.find({}).limit(3);

    res.json({
      success: true,
      message: 'Database connection working',
      prescription_count: count,
      sample_prescriptions: sample,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;