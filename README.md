# VAS Module - Value Added Services

A comprehensive warehouse management system for Value Added Services (VAS) operations.

## Features

### 1. Inbound Excel Upload
- Upload inbound shipment data using Excel files
- Automatic validation and data storage
- Support for item details, quantities, PO numbers, and supplier information

### 2. VAS Processing
Warehouse staff can perform various VAS tasks:
- **Labeling**: Add labels to products
- **Repacking**: Repackage items as needed
- **Quality Checking**: Perform quality inspections
- **Barcoding**: Add barcodes to items

Each task supports three statuses:
- Pending
- In Progress
- Completed

### 3. Automatic Outbound Update
- When all VAS tasks for an item are completed, the system automatically creates an outbound record
- Outbound orders reflect items ready for dispatch in real-time

### 4. Real-Time Tracking Dashboard
Live monitoring of all VAS activities:
- Current inbound batches being processed
- VAS task status per item
- Completion percentage
- Time taken for each stage
- Visual overview of workflow efficiency

## Installation

1. Clone the repository:
```bash
git clone https://github.com/lihindu96/vas-.git
cd vas-
```

2. Create a virtual environment and activate it:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

1. Start the application:
```bash
# Development mode (with debug enabled)
python run.py

# Production mode (debug disabled)
FLASK_ENV=production python run.py

# Or use a production WSGI server (recommended for production)
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 run:app
```

2. Open your browser and navigate to:
```
http://localhost:5000
```

3. Generate a sample Excel template:
```bash
python create_sample.py
```

4. Upload the sample Excel file through the dashboard

## Excel Template Format

Your Excel file should contain the following columns:
- **PO Number** (required): Purchase order number
- **Item Code** (required): Unique item identifier
- **Item Description** (optional): Item description
- **Quantity** (required): Number of items
- **Supplier** (optional): Supplier name

## API Endpoints

### Inbound Management
- `POST /api/upload/inbound` - Upload Excel file with inbound data
- `GET /api/inbound` - Get list of inbound items
- `GET /api/inbound/<id>` - Get detailed inbound item with VAS tasks

### VAS Task Management
- `GET /api/vas/tasks` - Get VAS tasks (with optional filtering)
- `PUT /api/vas/tasks/<id>` - Update VAS task status

### Outbound Management
- `GET /api/outbound` - Get outbound items ready for dispatch

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/batches` - Get list of all batches

## Project Structure

```
vas-/
├── app/
│   ├── __init__.py          # Application factory
│   ├── models.py            # Database models
│   ├── routes.py            # API routes
│   ├── services.py          # Business logic
│   ├── static/
│   │   ├── css/
│   │   │   └── style.css
│   │   └── js/
│   │       └── dashboard.js
│   └── templates/
│       └── dashboard.html
├── samples/
│   └── inbound_template.xlsx
├── requirements.txt
├── run.py                    # Application entry point
└── README.md
```

## Database Schema

### Inbound
- PO number, item code, description, quantity, supplier
- Received date, batch ID
- Relationship to VAS tasks

### VAS Task
- Task type (Labeling, Repacking, Quality Checking, Barcoding)
- Status (Pending, In Progress, Completed)
- Assigned staff, timestamps, notes
- Relationship to inbound items

### Outbound
- Item details from completed VAS items
- Ready for dispatch status
- Creation and dispatch timestamps

## Testing

Run the test suite:
```bash
pytest
```

## Security Considerations

**For Production Deployment:**

1. **Disable Debug Mode**: Set `FLASK_ENV=production` to disable the Flask debugger
2. **Use HTTPS**: Deploy behind a reverse proxy (nginx) with SSL/TLS
3. **Authentication**: Implement user authentication and role-based access control
4. **Database**: Use PostgreSQL or MySQL instead of SQLite for production
5. **File Upload Security**: The system already validates file types and sizes
6. **CORS Configuration**: Configure allowed origins in production
7. **Error Logging**: Errors are logged securely without exposing stack traces to users

**Current Security Features:**
- File type validation (only .xlsx, .xls allowed)
- File size limits (16MB maximum)
- SQL injection protection via SQLAlchemy ORM
- Input validation on all API endpoints
- Secure error handling without stack trace exposure

## License

MIT License
