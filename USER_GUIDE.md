# VAS Module User Guide

## Quick Start Guide

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/lihindu96/vas-.git
cd vas-

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Running the Application

```bash
python run.py
```

The application will start on `http://localhost:5000`

## Using the Dashboard

### Main Features Overview

The dashboard provides a comprehensive view of all warehouse VAS operations:

1. **Upload Section** (Top) - Upload Excel files with inbound data
2. **Statistics Overview** - Real-time metrics and KPIs
3. **Current Batches** - View all batches being processed
4. **Task Breakdown** - Status of each VAS task type
5. **Inbound Items** - List of all items with actions
6. **Outbound Items** - Items ready for dispatch

## Step-by-Step Workflow

### Step 1: Upload Inbound Data

1. Prepare your Excel file with these columns:
   - **PO Number** (Required) - Purchase Order number
   - **Item Code** (Required) - Unique identifier for the item
   - **Item Description** (Optional) - Description of the item
   - **Quantity** (Required) - Number of items
   - **Supplier** (Optional) - Supplier name

2. Generate a sample template:
   ```bash
   python create_sample.py
   ```
   This creates `samples/inbound_template.xlsx` with sample data

3. On the dashboard, click "Choose File" and select your Excel file
4. Click "Upload Excel"
5. The system will validate and import the data
6. Each item automatically gets 4 VAS tasks created:
   - Labeling
   - Repacking
   - Quality Checking
   - Barcoding

### Step 2: Process VAS Tasks

1. In the **Inbound Items** table, click "View Tasks" on any item
2. A modal will show all VAS tasks for that item
3. For each task, you can:
   - **Click "Start Task"** - Changes status from Pending → In Progress
   - **Click "Mark Complete"** - Changes status from In Progress → Completed
4. The system automatically tracks:
   - Who is assigned to the task
   - When the task started
   - When the task completed
   - Time taken for completion

### Step 3: Automatic Outbound Creation

When ALL four VAS tasks for an item are completed:
- The system automatically creates an outbound record
- The item appears in the **Outbound Items** section
- It's marked as "Ready for Dispatch"
- The dashboard stats update in real-time

### Step 4: Monitor Progress

The dashboard automatically refreshes every 30 seconds and shows:

**Overview Statistics:**
- Total inbound items
- Pending tasks count
- In-progress tasks count
- Completed tasks count
- Overall completion percentage
- Items ready for dispatch

**Current Batches:**
- Shows all batch IDs being processed
- Each batch can contain multiple items from the same upload

**Task Breakdown:**
- Shows statistics for each task type (Labeling, Repacking, etc.)
- Displays pending, in progress, and completed counts

## API Reference

### Upload Inbound Data

```http
POST /api/upload/inbound
Content-Type: multipart/form-data

file: <Excel file>
```

Response:
```json
{
  "success": true,
  "message": "Successfully processed 4 records in batch BATCH-20251020080000",
  "records_created": 4
}
```

### Get Inbound Items

```http
GET /api/inbound?page=1&per_page=20&batch_id=BATCH-001
```

Response:
```json
{
  "items": [
    {
      "id": 1,
      "po_number": "PO-001",
      "item_code": "ITEM-A001",
      "item_description": "Widget Type A",
      "quantity": 100,
      "supplier": "Supplier ABC",
      "received_date": "2025-10-20T08:00:00",
      "batch_id": "BATCH-001"
    }
  ],
  "total": 1,
  "pages": 1,
  "current_page": 1
}
```

### Get Inbound Item Details

```http
GET /api/inbound/1
```

Response:
```json
{
  "id": 1,
  "po_number": "PO-001",
  "item_code": "ITEM-A001",
  "vas_tasks": [
    {
      "id": 1,
      "task_type": "Labeling",
      "status": "Completed",
      "time_taken": 120.5
    }
  ],
  "outbound": []
}
```

### Update VAS Task Status

```http
PUT /api/vas/tasks/1
Content-Type: application/json

{
  "status": "In Progress",
  "assigned_to": "John Doe",
  "notes": "Started processing"
}
```

Response:
```json
{
  "success": true,
  "message": "Task updated successfully"
}
```

### Get Dashboard Statistics

```http
GET /api/dashboard/stats
```

Response:
```json
{
  "total_inbound": 10,
  "total_tasks": 40,
  "pending_tasks": 15,
  "in_progress_tasks": 10,
  "completed_tasks": 15,
  "completion_percentage": 37.5,
  "total_outbound": 2,
  "current_batches": ["BATCH-001", "BATCH-002"],
  "task_breakdown": {
    "Labeling": {
      "pending": 3,
      "in_progress": 2,
      "completed": 5
    }
  }
}
```

### Get Outbound Items

```http
GET /api/outbound?ready_only=true
```

Response:
```json
[
  {
    "id": 1,
    "inbound_id": 1,
    "item_code": "ITEM-A001",
    "item_description": "Widget Type A",
    "quantity": 100,
    "ready_for_dispatch": true,
    "created_at": "2025-10-20T09:00:00",
    "dispatched_at": null
  }
]
```

## Database Schema

### Inbound Table
- id: Primary key
- po_number: Purchase order number
- item_code: Item identifier
- item_description: Item description
- quantity: Number of items
- supplier: Supplier name
- received_date: When received
- batch_id: Batch identifier

### VAS Task Table
- id: Primary key
- inbound_id: Foreign key to Inbound
- task_type: Labeling, Repacking, Quality Checking, or Barcoding
- status: Pending, In Progress, or Completed
- assigned_to: Staff member assigned
- started_at: When task started
- completed_at: When task completed
- notes: Additional notes

### Outbound Table
- id: Primary key
- inbound_id: Foreign key to Inbound
- item_code: Item identifier
- item_description: Item description
- quantity: Number of items
- ready_for_dispatch: Boolean flag
- created_at: When created
- dispatched_at: When dispatched

## Tips and Best Practices

1. **Batch Processing**: Upload related items together to create logical batches
2. **Monitoring**: Use the dashboard filter to focus on specific batches
3. **Task Assignment**: Update the "assigned_to" field when starting tasks
4. **Notes**: Add notes to tasks for better tracking and communication
5. **Auto-Refresh**: The dashboard auto-refreshes every 30 seconds to show latest data
6. **Testing**: Use the sample Excel template to test the system first

## Troubleshooting

### Upload Issues
- **Error: "Missing required columns"**: Ensure your Excel has PO Number, Item Code, and Quantity columns
- **Error: "Invalid file type"**: Only .xlsx and .xls files are supported

### Task Update Issues
- **Cannot start task**: Ensure the task status is "Pending"
- **Cannot complete task**: Ensure the task status is "In Progress"

### Performance
- For large batches (>1000 items), the initial upload may take a few seconds
- The dashboard automatically handles pagination for large datasets

## Development and Testing

### Running Tests

```bash
pytest tests/ -v
```

### Test Coverage
The test suite covers:
- Excel upload functionality
- VAS task status updates
- Automatic outbound creation
- Dashboard statistics
- API endpoints
- Database operations

All tests use in-memory SQLite for fast execution without affecting production data.

## Security Considerations

1. File uploads are validated for type (.xlsx, .xls only)
2. File size is limited to 16MB
3. SQL injection protection through SQLAlchemy ORM
4. CORS is enabled for API access
5. In production, use proper authentication and HTTPS

## Future Enhancements

Potential features for future versions:
- User authentication and role-based access
- Email notifications when tasks are completed
- Advanced reporting and analytics
- Integration with barcode scanners
- Mobile app for warehouse staff
- Export functionality for reports
- Photo upload for quality checking tasks
