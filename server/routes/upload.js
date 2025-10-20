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

    // Read the Excel file
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    // Process each row and create inbound items
    const createdItems = [];
    data.forEach(row => {
      const item = dataStore.createInboundItem({
        poNumber: row.PONumber || row.poNumber || row['PO Number'] || '',
        itemCode: row.ItemCode || row.itemCode || row['Item Code'] || '',
        itemDescription: row.ItemDescription || row.itemDescription || row['Item Description'] || '',
        quantity: parseInt(row.Quantity || row.quantity || 0)
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
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
