const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const OnboardingService = require('../services/onboarding.service');

// Middleware to validate authentication
const validateAuth = (req, res, next) => {
  const { token, 'user-id': userId } = req.headers;

  if (!token || !userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Add additional token validation logic here if needed
  next();
};

// Get all pending users
router.get('/users', validateAuth, async (req, res) => {
  try {
    const { page = 0, limit = 10, status = 'pending' } = req.query;
    const result = await OnboardingService.getPendingUsers(
      parseInt(page),
      parseInt(limit),
      status
    );

    if (result.error) {
      return res.status(500).json(result);
    }

    res.json(result.response);
  } catch (error) {
    console.error('Error in onboarding users route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID
router.get('/users/:id', validateAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await OnboardingService.getUserById(id);

    if (result.error) {
      return res.status(500).json(result);
    }

    res.json(result.response);
  } catch (error) {
    console.error('Error in onboarding user details route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve user
router.post('/users/:id/approve', validateAuth, async (req, res) => {
  try {
		const { 'user-id': cubeUserId } = req.headers;
    const { id } = req.params;
    const result = await OnboardingService.approveUser(id, cubeUserId);

    if (result.error) {
      return res.status(500).json(result);
    }

    res.json(result.response);
  } catch (error) {
    console.error('Error in approve user route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user status
router.post('/users/:id/status', validateAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const result = await OnboardingService.updateUserStatus(id, status);

    if (result.error) {
      return res.status(500).json(result);
    }

    res.json(result.response);
  } catch (error) {
    console.error('Error in update user status route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new user
router.post('/users/create', validateAuth, async (req, res) => {
  try {
    const { name, email, password, sendEmail } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const userData = {
      name,
      email,
      password,
      sendEmail: sendEmail || false
    };

    const result = await OnboardingService.createUser(userData);

    if (result.error) {
      return res.status(500).json(result);
    }

    res.status(201).json(result.response);
  } catch (error) {
    console.error('Error in create user route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user
router.delete('/users/:id', validateAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const result = await OnboardingService.deleteUser(id);

    if (result.error) {
      return res.status(500).json(result);
    }

    res.json(result.response);
  } catch (error) {
    console.error('Error in delete user route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add this route to the existing onboarding.js file

// Configure multer for PDF document uploads
const documentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/uploads/signed-documents')
  },
  filename: function (req, file, cb) {
    const originalName = file.originalname.toLowerCase();
    const fileExtension = path.extname(originalName);

    if (fileExtension !== '.pdf') {
      return cb(new Error('Only PDF files are allowed'), null);
    }

    const timestamp = Date.now();
    const randomNum = Math.round(Math.random() * 100000000000000);
    const safeName = `${timestamp}_${randomNum}_${file.fieldname}${fileExtension}`;

    cb(null, safeName);
  }
});

const uploadDocuments = multer({
  storage: documentStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for PDFs
    files: 2 // Allow up to 2 files (NDA + Service Agreement)
  },
  fileFilter: function (req, file, cb) {
    // Check MIME type for PDF
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed.'), false);
    }

    // Check file extension
    const fileExtension = path.extname(file.originalname.toLowerCase());
    if (fileExtension !== '.pdf') {
      return cb(new Error('Only PDF files are allowed.'), false);
    }

    // Check for suspicious filenames
    if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
      return cb(new Error('Invalid filename.'), false);
    }

    // Only allow specific field names
    if (file.fieldname !== 'nda' && file.fieldname !== 'service_agreement') {
      return cb(new Error('Invalid field name. Only "nda" and "service_agreement" are allowed.'), false);
    }

    cb(null, true);
  }
});

// Upload signed documents - Updated to handle multipart form data
router.post('/users/:id/upload-signed-documents', validateAuth, (req, res) => {
  uploadDocuments.fields([
    { name: 'nda', maxCount: 1 },
    { name: 'service_agreement', maxCount: 1 }
  ])(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      // Handle Multer-specific errors
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ error: 'Too many files for a single field.' });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ error: 'Unexpected field name. Only "nda" and "service_agreement" are allowed.' });
      }
      return res.status(400).json({ error: 'Upload error: ' + err.message });
    } else if (err) {
      // Handle other errors (like file type validation)
      return res.status(400).json({ error: err.message });
    }

    try {
      const { id } = req.params;

      // Check if at least one file was uploaded
      if (!req.files || (!req.files.nda && !req.files.service_agreement)) {
        return res.status(400).json({ error: 'At least one document file is required' });
      }

      // Extract filenames from uploaded files
      const documentData = {};
      if (req.files.nda && req.files.nda[0]) {
        documentData.nda = req.files.nda[0].filename;
      }
      if (req.files.service_agreement && req.files.service_agreement[0]) {
        documentData.service_agreement = req.files.service_agreement[0].filename;
      }

      console.log('Uploaded documents:', documentData);

      const result = await OnboardingService.updateSignedDocuments(id, documentData, req.files);

      if (result.error) {
        return res.status(500).json(result);
      }

      // Return success response with file information
      const response = {
        message: 'Documents uploaded successfully',
				success: true,
        files: {}
      };

      if (req.files.nda && req.files.nda[0]) {
        response.files.nda = {
          filename: req.files.nda[0].filename,
          originalName: req.files.nda[0].originalname,
          size: req.files.nda[0].size
        };
      }

      if (req.files.service_agreement && req.files.service_agreement[0]) {
        response.files.service_agreement = {
          filename: req.files.service_agreement[0].filename,
          originalName: req.files.service_agreement[0].originalname,
          size: req.files.service_agreement[0].size
        };
      }

      res.json(response);
    } catch (error) {
      console.error('Error in upload signed documents route:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
});

module.exports = router;
