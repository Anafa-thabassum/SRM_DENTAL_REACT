// server/routes/patient-details-route.js
import express from 'express';
import { PatientDetails } from '../models/patientDetails.js';

const router = express.Router();

// Create new patient
router.post('/', async (req, res) => {
  try {
    console.log('Creating new patient with data:', req.body);

    const { patientId, personalInfo, status = 'active' } = req.body;

    // Validate required fields
    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required'
      });
    }

    if (!personalInfo || !personalInfo.firstName || !personalInfo.lastName) {
      return res.status(400).json({
        success: false,
        message: 'First name and last name are required'
      });
    }

    // Check if patient ID already exists
    const existingPatient = await PatientDetails.findOne({ patientId: patientId });

    if (existingPatient) {
      return res.status(409).json({
        success: false,
        message: `Patient with ID ${patientId} already exists`
      });
    }

    // Create new patient
    const newPatient = new PatientDetails({
      patientId,
      personalInfo,
      status,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const savedPatient = await newPatient.save();

    console.log('Patient created successfully:', savedPatient.patientId);

    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      patient: savedPatient,
      data: savedPatient // Include both for compatibility
    });

  } catch (error) {
    console.error('Error creating patient:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Patient ID already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Update existing patient
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log(`Updating patient ${id} with data:`, updateData);

    // Add updated timestamp
    updateData.updatedAt = new Date();

    const updatedPatient = await PatientDetails.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedPatient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Patient updated successfully',
      patient: updatedPatient,
      data: updatedPatient
    });

  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Update patient by patientId (not _id)
router.put('/by-patient-id/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const updateData = req.body;

    console.log(`Updating patient ${patientId} with data:`, updateData);

    // Add updated timestamp
    updateData.updatedAt = new Date();

    const updatedPatient = await PatientDetails.findOneAndUpdate(
      { patientId: patientId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedPatient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Patient updated successfully',
      patient: updatedPatient,
      data: updatedPatient
    });

  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get patient details by patientId (not _id)
router.get('/by-patient-id/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await PatientDetails.findOne({ patientId: patientId });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      success: true,
      data: patient,
      patient: patient, // Include both for compatibility
      message: 'Patient details retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching patient details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get all patient details
router.get('/', async (req, res) => {
  try {
    console.log('Fetching all patients...');

    // Get query parameters for filtering and pagination
    const { page = 1, limit = 50, status, search } = req.query;

    // Build filter object
    let filter = {};

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { patientId: { $regex: search, $options: 'i' } },
        { 'personalInfo.firstName': { $regex: search, $options: 'i' } },
        { 'personalInfo.lastName': { $regex: search, $options: 'i' } },
        { 'personalInfo.phone': { $regex: search, $options: 'i' } },
        { 'personalInfo.email': { $regex: search, $options: 'i' } }
      ];
    }

    const patients = await PatientDetails.find(filter)
      .populate('userId', 'email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await PatientDetails.countDocuments(filter);

    console.log(`Found ${patients.length} patients (total: ${total})`);

    res.status(200).json({
      success: true,
      patients: patients, // Frontend expects 'patients' key
      data: patients, // Include both for compatibility
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total: total,
        limit: parseInt(limit)
      },
      message: 'All patient details retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching all patient details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get patient details by _id (existing functionality)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await PatientDetails.findById(id).populate('userId', 'email');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      success: true,
      data: patient,
      patient: patient, // Include both for compatibility
      message: 'Patient details retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching patient details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Delete patient
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedPatient = await PatientDetails.findByIdAndDelete(id);

    if (!deletedPatient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Patient deleted successfully',
      patient: deletedPatient
    });

  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Delete patient by patientId
router.delete('/by-patient-id/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;

    const deletedPatient = await PatientDetails.findOneAndDelete({ patientId: patientId });

    if (!deletedPatient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Patient deleted successfully',
      patient: deletedPatient
    });

  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get patient statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalPatients = await PatientDetails.countDocuments();
    const activePatients = await PatientDetails.countDocuments({ status: 'active' });
    const inactivePatients = await PatientDetails.countDocuments({ status: 'inactive' });

    // Get patients created today
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const newToday = await PatientDetails.countDocuments({
      createdAt: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    });

    res.status(200).json({
      success: true,
      stats: {
        total: totalPatients,
        active: activePatients,
        inactive: inactivePatients,
        newToday: newToday
      },
      message: 'Patient statistics retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching patient statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

export default router;