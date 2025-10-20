const xlsx = require('xlsx');
const path = require('path');

// Sample data
const data = [
  {
    PONumber: 'PO-2025-001',
    ItemCode: 'ITEM-A001',
    ItemDescription: 'Premium Wireless Headphones',
    Quantity: 100
  },
  {
    PONumber: 'PO-2025-002',
    ItemCode: 'ITEM-B002',
    ItemDescription: 'USB-C Charging Cable',
    Quantity: 250
  },
  {
    PONumber: 'PO-2025-003',
    ItemCode: 'ITEM-C003',
    ItemDescription: 'Smartphone Case - Black',
    Quantity: 150
  },
  {
    PONumber: 'PO-2025-004',
    ItemCode: 'ITEM-D004',
    ItemDescription: 'Screen Protector - Tempered Glass',
    Quantity: 200
  },
  {
    PONumber: 'PO-2025-005',
    ItemCode: 'ITEM-E005',
    ItemDescription: 'Power Bank 20000mAh',
    Quantity: 75
  }
];

// Create workbook and worksheet
const ws = xlsx.utils.json_to_sheet(data);
const wb = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb, ws, 'Inbound Items');

// Write to file
const filePath = path.join(__dirname, 'sample-inbound-data.xlsx');
xlsx.writeFile(wb, filePath);

console.log(`Sample Excel file created: ${filePath}`);
