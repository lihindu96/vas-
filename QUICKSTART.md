# VAS Module - Quick Start Guide

## Prerequisites
- Node.js v14 or higher
- npm (comes with Node.js)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/lihindu96/vas-.git
cd vas-
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## Quick Test with Sample Data

1. The repository includes a sample Excel file: `sample-inbound-data.xlsx`

2. Upload it using the web interface:
   - Click on the upload area or "Select File" button
   - Choose `sample-inbound-data.xlsx`
   - The system will process and display 5 sample items

3. Create a VAS task:
   - Select an item from the dropdown
   - Choose a task type (Labeling, Repacking, or QC)
   - Enter an assignee name
   - Click "Create Task"

4. Work on the task:
   - Click "Start" to begin the task
   - Click "Complete" when finished
   - Watch the dashboard update in real-time!

## Creating Your Own Excel File

Your Excel file should have these columns:

| PONumber | ItemCode | ItemDescription | Quantity |
|----------|----------|----------------|----------|
| PO-001   | ITEM-001 | Product 1      | 100      |
| PO-002   | ITEM-002 | Product 2      | 50       |

Alternative column names are also supported:
- `PO Number` instead of `PONumber`
- `Item Code` instead of `ItemCode`
- `Item Description` instead of `ItemDescription`

## Understanding the Workflow

1. **Upload** → Items are in INBOUND status
2. **Create Tasks** → Assign VAS work (Labeling, Repacking, QC)
3. **Start Tasks** → Tasks move to IN_PROGRESS
4. **Complete Tasks** → Tasks move to COMPLETED
5. **Auto Update** → When ALL tasks are done, item automatically moves to OUTBOUND status

## Features at a Glance

### Real-time Dashboard
- Shows live statistics that update every 5 seconds
- Track total inbound items, tasks, completion rates
- Monitor outbound ready items

### Task Management
- Create multiple tasks per item
- Three task types: Labeling, Repacking, QC
- Assign tasks to team members
- Add notes for each task

### Progress Tracking
- Visual progress bars for each item
- Task counts (completed/total)
- Status badges (INBOUND, OUTBOUND, PENDING, IN_PROGRESS, COMPLETED)

## API Endpoints

If you want to integrate with other systems:

### Upload
```bash
curl -F "file=@yourfile.xlsx" http://localhost:3000/api/upload
```

### Create Task
```bash
curl -X POST http://localhost:3000/api/vas/tasks \
  -H "Content-Type: application/json" \
  -d '{"inboundItemId":"item-id","taskType":"LABELING","assignedTo":"John"}'
```

### Get Statistics
```bash
curl http://localhost:3000/api/dashboard/stats
```

See [README.md](README.md) for complete API documentation.

## Troubleshooting

### Server won't start
- Check if port 3000 is already in use
- Try changing the port: `PORT=3001 npm start`

### Upload fails
- Ensure file is .xlsx or .xls format
- File size must be under 5MB
- File must have the required columns

### Tasks not updating item status
- All tasks for an item must be COMPLETED
- Check that tasks are associated with the correct item
- Refresh the page to see latest data

## Production Deployment

For production use, please review:
- [SECURITY.md](SECURITY.md) - Security considerations and recommendations
- [README.md](README.md) - Complete documentation

Important production considerations:
- Use a real database instead of in-memory storage
- Implement authentication and authorization
- Add rate limiting
- Use HTTPS
- Set up proper logging and monitoring

## Support

For issues or questions, please open an issue on GitHub.
