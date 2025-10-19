// server/Server.js - Updated version with proper route registration
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/Auth.js';
import otpRoutes from './routes/send-otp.js';
import appointmentRoutes from './routes/appointment.js';
import doctorPatientRoutes from './routes/doctor-patient-route.js';
import pedodonticsRoutes from './routes/caseSheetRoutes.js';
import prescriptionRoutes from './routes/prescription.js';
import patientDetailsRoutes from './routes/patient-details-route.js';

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Middlewares
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Increase payload limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('Headers:', req.headers);

  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Health check routes
app.get('/', (req, res) => {
  res.json({
    message: 'Backend running...',
    timestamp: new Date().toISOString(),
    mongodb_status: 'Connected',
    routes: [
      'GET /',
      'GET /api/test',
      'GET /api/patient-details',
      'POST /api/patient-details',
      'GET /api/patient-details/:id',
      'PUT /api/patient-details/:id',
      'DELETE /api/patient-details/:id',
      'GET /api/patient-details/by-patient-id/:patientId',
      'PUT /api/patient-details/by-patient-id/:patientId',
      'DELETE /api/patient-details/by-patient-id/:patientId',
      'GET /api/patient-details/stats/overview',
      'POST /api/prescriptions',
      'GET /api/prescriptions/test',
      'GET /api/prescriptions/patient/:patientId',
      '/api/auth/*',
      '/api/otp/*',
      '/api/appointment/*',
      '/api/doctor-patient/*',
      '/api/pedodontics/*'
    ]
  });
});

app.get('/api/test', (req, res) => {
  res.json({
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes - Make sure all routes are properly registered
console.log('Registering routes...');

app.use('/api/auth', authRoutes);
console.log('✓ Auth routes registered at /api/auth');

app.use('/api/otp', otpRoutes);
console.log('✓ OTP routes registered at /api/otp');

app.use('/api/appointment', appointmentRoutes);
console.log('✓ Appointment routes registered at /api/appointment');

app.use('/api/doctor-patient', doctorPatientRoutes);
console.log('✓ Doctor-patient routes registered at /api/doctor-patient');

app.use('/api/pedodontics', pedodonticsRoutes);
console.log('✓ Pedodontics routes registered at /api/pedodontics');

app.use('/api/prescriptions', prescriptionRoutes);
console.log('✓ Prescription routes registered at /api/prescriptions');

// THIS IS THE IMPORTANT ONE - Make sure patient-details routes are registered
app.use('/api/patient-details', patientDetailsRoutes);
console.log('✓ Patient details routes registered at /api/patient-details');

// Debug endpoint to list all registered routes
app.get('/api/debug/routes', (req, res) => {
  const routes = [];

  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Routes registered directly on the app
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      // Router middleware
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push({
            path: middleware.regexp.source.replace('\\/?(?=\\/|$)', '') + handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });

  res.json({
    success: true,
    message: 'Available routes',
    routes: routes,
    timestamp: new Date().toISOString()
  });
});

// Test endpoint for patient-details specifically
app.get('/api/debug/patient-details-test', async (req, res) => {
  try {
    // Import the model to test
    const { PatientDetails } = await import('./models/patientDetails.js');

    const count = await PatientDetails.countDocuments();
    const sample = await PatientDetails.find({}).limit(2);

    res.json({
      success: true,
      message: 'Patient details endpoint is working',
      database_connection: 'OK',
      patient_count: count,
      sample_patients: sample,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error testing patient details',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler caught error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// 404 handler - MUST be last
app.use((req, res, next) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);

  // List available patient-details routes specifically since that's what's failing
  const patientDetailsRoutes = [
    'GET /api/patient-details - Get all patients',
    'POST /api/patient-details - Create new patient',
    'GET /api/patient-details/:id - Get patient by ID',
    'PUT /api/patient-details/:id - Update patient by ID',
    'DELETE /api/patient-details/:id - Delete patient by ID',
    'GET /api/patient-details/by-patient-id/:patientId - Get patient by patientId',
    'PUT /api/patient-details/by-patient-id/:patientId - Update patient by patientId',
    'DELETE /api/patient-details/by-patient-id/:patientId - Delete patient by patientId',
    'GET /api/patient-details/stats/overview - Get patient statistics'
  ];

  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
    availableRoutes: [
      'GET /',
      'GET /api/test',
      'GET /api/debug/routes',
      'GET /api/debug/patient-details-test',
      ...patientDetailsRoutes,
      'POST /api/prescriptions',
      'GET /api/prescriptions/test',
      'GET /api/prescriptions/patient/:patientId'
    ]
  });
});
// Test prescription endpoint specifically
app.post('/api/test-prescription', async (req, res) => {
  try {
    console.log('Test prescription endpoint hit');
    console.log('Body:', req.body);

    // Import the model
    const Prescription = (await import('./models/Prescription.js')).default;

    const testPrescription = new Prescription({
      patientId: 'TEST123',
      patientData: {
        name: 'Test Patient',
        age: 25,
        gender: 'male',
        date: new Date()
      },
      symptoms: 'Test symptoms',
      diagnosis: 'Test diagnosis',
      medicines: [{
        type: 'pills',
        name: 'Test Medicine',
        dosage: { m: '1', n: '0', e: '1', n2: '0' },
        foodIntake: 'after',
        duration: 5,
        asNeeded: false
      }],
      doctorId: 'DOC001',
      doctorName: 'Dr. Test'
    });

    const saved = await testPrescription.save();

    res.json({
      success: true,
      message: 'Test prescription saved successfully',
      data: saved
    });
  } catch (error) {
    console.error('Test prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Test prescription failed',
      error: error.message,
      stack: error.stack
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('='.repeat(60));
  console.log('Available endpoints:');
  console.log(`   Home: http://localhost:${PORT}/`);
  console.log(`   Test: http://localhost:${PORT}/api/test`);
  console.log(`   Debug Routes: http://localhost:${PORT}/api/debug/routes`);
  console.log(`   Patient Details:`);
  console.log(`      • GET    http://localhost:${PORT}/api/patient-details`);
  console.log(`      • POST   http://localhost:${PORT}/api/patient-details`);
  console.log(`      • GET    http://localhost:${PORT}/api/patient-details/:id`);
  console.log(`      • PUT    http://localhost:${PORT}/api/patient-details/:id`);
  console.log(`   Prescriptions: http://localhost:${PORT}/api/prescriptions`);
  console.log('='.repeat(60) + '\n');
});

export default app;