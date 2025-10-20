const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const dataStore = require('../models/dataStore');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.xlsx' && ext !== '.xls') {
      return cb(new Error('Only Excel files are allowed'));
    }
    cb(null, true);
  }
});

// Upload Excel file and process inbound data
router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Read the Excel file with security considerations
    // Note: xlsx@0.18.5 has known vulnerabilities (ReDoS and Prototype Pollution)
    // Mitigation: Limit file size (handled by multer), validate data structure
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    // Validate data size to prevent DoS
    if (data.length > 10000) {
      return res.status(400).json({ error: 'File contains too many rows (max 10000)' });
    }

    // Process each row and create inbound items with validation
    const createdItems = [];
    data.forEach(row => {
      // Sanitize inputs to prevent prototype pollution
      const poNumber = String(row.PONumber || row.poNumber || row['PO Number'] || '').substring(0, 100);
      const itemCode = String(row.ItemCode || row.itemCode || row['Item Code'] || '').substring(0, 100);
      const itemDescription = String(row.ItemDescription || row.itemDescription || row['Item Description'] || '').substring(0, 500);
      const quantity = Math.max(0, Math.min(999999, parseInt(row.Quantity || row.quantity || 0) || 0));

      const item = dataStore.createInboundItem({
        poNumber,
        itemCode,
        itemDescription,
        quantity
      });
      createdItems.push(item);
    });

    res.json({
      success: true,
      message: `Successfully processed ${createdItems.length} items`,
      items: createdItems
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process file' });
  }
});

module.exports = router;
