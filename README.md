# VAS - Value Added Services Management System

A comprehensive web-based system for managing inbound goods processing and tracking through Value Added Services (VAS).

## Features

### 📤 Excel Upload
- Upload inbound data via Excel files (.xlsx, .xls)
- Automatically parse and import item details including:
  - PO Number
  - Item Code
  - Item Description
  - Quantity

### 🔧 VAS Task Management
- Create and manage three types of VAS tasks:
  - **Labeling**: Item labeling operations
  - **Repacking**: Product repacking services
  - **QC**: Quality Check procedures
- Assign tasks to team members
- Track task status (Pending → In Progress → Completed)

### 🔄 Automatic Status Updates
- When all VAS tasks for an item are completed, the system automatically:
  - Updates the item status from INBOUND to OUTBOUND
  - Makes the item ready for outbound processing

### 📊 Real-time Dashboard
- Live statistics showing:
  - Total inbound items
  - Total tasks created
  - Completed tasks
  - In-progress tasks
  - Pending tasks
  - Outbound ready items
  - Overall completion rate
- Task progress tracking for each inbound item
- Auto-refresh every 5 seconds for real-time updates

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm

### Setup
1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

### 1. Upload Inbound Data
- Click on the upload area or "Select File" button
- Choose an Excel file with the following columns:
  - `PONumber` or `PO Number`
  - `ItemCode` or `Item Code`
  - `ItemDescription` or `Item Description`
  - `Quantity`
- The system will automatically process and display the items

### 2. Create VAS Tasks
- Select an inbound item from the dropdown
- Choose the task type (Labeling, Repacking, or QC)
- Optionally assign the task to a team member
- Add any notes if needed
- Click "Create Task"

### 3. Manage Tasks
- View all tasks in the VAS Tasks table
- Click "Start" to begin working on a pending task
- Click "Complete" when the task is finished
- The system will automatically update the outbound status when all tasks are done

### 4. Monitor Progress
- View real-time statistics in the dashboard
- Track progress for each inbound item
- Monitor task completion rates
- The interface automatically refreshes to show the latest data

## Excel File Format

Create an Excel file with these columns:

| PONumber | ItemCode | ItemDescription | Quantity |
|----------|----------|----------------|----------|
| PO-001   | ITEM-001 | Sample Item 1  | 100      |
| PO-002   | ITEM-002 | Sample Item 2  | 50       |

Alternative column names are also supported:
- `PO Number` instead of `PONumber`
- `Item Code` instead of `ItemCode`
- `Item Description` instead of `ItemDescription`

## API Endpoints

### Upload
- `POST /api/upload` - Upload Excel file with inbound data

### VAS Management
- `GET /api/vas/inbound` - Get all inbound items
- `GET /api/vas/tasks` - Get all VAS tasks
- `POST /api/vas/tasks` - Create a new VAS task
- `PATCH /api/vas/tasks/:id/start` - Start a task
- `PATCH /api/vas/tasks/:id/complete` - Complete a task
- `GET /api/vas/inbound/:id/tasks` - Get tasks for specific item

### Dashboard
- `GET /api/dashboard/stats` - Get overall statistics
- `GET /api/dashboard/progress` - Get detailed progress for all items
- `GET /api/dashboard/task-breakdown` - Get task breakdown by type

## Technology Stack

### Backend
- **Node.js** with Express.js
- **Multer** for file upload handling
- **XLSX** for Excel file processing
- **CORS** for cross-origin resource sharing

### Frontend
- Pure HTML5, CSS3, and JavaScript
- No framework dependencies for lightweight deployment
- Real-time auto-refresh functionality
- Responsive design

## Data Storage

Currently, the system uses in-memory storage for simplicity. In a production environment, you would integrate with a database like:
- MongoDB
- PostgreSQL
- MySQL

## Future Enhancements

- User authentication and authorization
- Database integration
- Export functionality
- Advanced reporting
- Email notifications
- Mobile app support
- Barcode scanning integration

## License

ISC

## Author

VAS Operations Team
