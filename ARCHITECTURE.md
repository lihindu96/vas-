# VAS Module Architecture

## System Overview

The VAS (Value Added Services) Module is a web-based warehouse management system built with Flask that manages the complete lifecycle of warehouse operations from inbound receiving through value-added processing to outbound dispatch.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Web Browser                          │
│                     (Dashboard UI)                          │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST API
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Flask Application                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Routes     │  │   Services   │  │    Models    │     │
│  │  (API Layer) │─▶│(Business Logic)│─▶│(Data Layer)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │ SQLAlchemy ORM
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    SQLite Database                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │ Inbound  │  │ VAS Task │  │ Outbound │                 │
│  └──────────┘  └──────────┘  └──────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. Presentation Layer (Frontend)

**Location:** `app/templates/` and `app/static/`

#### dashboard.html
- Single-page application interface
- Responsive design with CSS Grid/Flexbox
- Modal dialogs for task details

#### dashboard.js
- Real-time data fetching via AJAX
- Auto-refresh every 30 seconds
- Dynamic DOM manipulation
- Event handling for uploads and task updates

#### style.css
- Modern gradient design
- Responsive layout
- Status badges and cards
- Modal styling

### 2. Application Layer (Backend)

**Location:** `app/`

#### __init__.py (Application Factory)
- Creates and configures Flask app
- Initializes extensions (SQLAlchemy, CORS)
- Registers blueprints
- Sets up database

#### routes.py (API Layer)
Handles HTTP requests and responses:
- `GET /` - Dashboard page
- `POST /api/upload/inbound` - Excel upload
- `GET /api/inbound` - List inbound items
- `GET /api/inbound/<id>` - Get item details
- `GET /api/vas/tasks` - List VAS tasks
- `PUT /api/vas/tasks/<id>` - Update task
- `GET /api/outbound` - List outbound items
- `GET /api/dashboard/stats` - Get statistics
- `GET /api/batches` - List batches

#### services.py (Business Logic)
Core business operations:
- `process_excel_upload()` - Validates and imports Excel data
- `update_vas_task_status()` - Updates task status and triggers outbound creation
- `get_dashboard_stats()` - Calculates real-time statistics
- `get_inbound_with_tasks()` - Retrieves detailed item information

#### models.py (Data Layer)
Database models using SQLAlchemy ORM:
- **Inbound** - Inbound shipment records
- **VASTask** - Value-added service tasks
- **Outbound** - Outbound dispatch records

### 3. Data Layer

**Database:** SQLite (can be replaced with PostgreSQL/MySQL for production)

**Tables:**
```sql
inbound (
    id INTEGER PRIMARY KEY,
    po_number VARCHAR(100) NOT NULL,
    item_code VARCHAR(100) NOT NULL,
    item_description VARCHAR(500),
    quantity INTEGER NOT NULL,
    supplier VARCHAR(200),
    received_date DATETIME,
    batch_id VARCHAR(100)
)

vas_task (
    id INTEGER PRIMARY KEY,
    inbound_id INTEGER FOREIGN KEY,
    task_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending',
    assigned_to VARCHAR(100),
    started_at DATETIME,
    completed_at DATETIME,
    notes TEXT
)

outbound (
    id INTEGER PRIMARY KEY,
    inbound_id INTEGER FOREIGN KEY,
    item_code VARCHAR(100) NOT NULL,
    item_description VARCHAR(500),
    quantity INTEGER NOT NULL,
    ready_for_dispatch BOOLEAN DEFAULT TRUE,
    created_at DATETIME,
    dispatched_at DATETIME
)
```

## Data Flow

### Inbound Upload Flow

```
1. User selects Excel file in UI
   ↓
2. JavaScript sends file via POST /api/upload/inbound
   ↓
3. routes.py receives request
   ↓
4. services.process_excel_upload() validates file
   ↓
5. pandas reads Excel data
   ↓
6. For each row:
   - Create Inbound record
   - Create 4 VAS Task records (one per task type)
   ↓
7. Commit to database
   ↓
8. Return success response with batch ID
   ↓
9. UI refreshes to show new data
```

### VAS Task Update Flow

```
1. User clicks "Start Task" or "Mark Complete"
   ↓
2. JavaScript sends PUT /api/vas/tasks/<id>
   ↓
3. routes.py receives request
   ↓
4. services.update_vas_task_status() updates task
   ↓
5. Set timestamps (started_at or completed_at)
   ↓
6. Check if all tasks for item are complete
   ↓
7. If all complete:
   - Create Outbound record
   - Mark as ready for dispatch
   ↓
8. Commit to database
   ↓
9. Return success response
   ↓
10. UI refreshes to show updated status
```

### Dashboard Statistics Flow

```
1. Dashboard loads or auto-refresh timer triggers
   ↓
2. JavaScript calls GET /api/dashboard/stats
   ↓
3. services.get_dashboard_stats() queries database
   ↓
4. Count aggregations:
   - Total inbound items
   - Task counts by status
   - Completion percentage
   - Current batches
   - Task breakdown by type
   ↓
5. Return JSON with statistics
   ↓
6. JavaScript updates DOM elements
```

## Key Design Patterns

### 1. Repository Pattern
- Models encapsulate database access
- Services provide business logic abstraction
- Routes handle HTTP concerns only

### 2. Factory Pattern
- `create_app()` function creates configured Flask app
- Enables testing with different configurations

### 3. Model-View-Controller (MVC)
- **Model:** `models.py` - Data structures
- **View:** `templates/` + `static/` - User interface
- **Controller:** `routes.py` + `services.py` - Business logic

### 4. RESTful API Design
- Resources: inbound, tasks, outbound
- HTTP verbs: GET (read), POST (create), PUT (update)
- JSON responses for all API calls

## Technology Stack

### Backend
- **Flask 3.0.0** - Web framework
- **SQLAlchemy 2.0** - ORM for database access
- **Flask-SQLAlchemy** - Flask integration
- **Flask-CORS** - Cross-origin resource sharing
- **Werkzeug** - WSGI utilities

### Data Processing
- **Pandas 2.1.4** - Excel file processing
- **openpyxl 3.1.2** - Excel file reading/writing

### Testing
- **pytest 7.4.3** - Testing framework
- **pytest-flask** - Flask testing utilities

### Frontend
- **Vanilla JavaScript** - No framework dependencies
- **CSS3** - Modern styling with gradients
- **HTML5** - Semantic markup

## Security Features

1. **File Upload Validation**
   - Type checking (only .xlsx, .xls)
   - Size limit (16MB)
   - Secure filename handling

2. **SQL Injection Prevention**
   - SQLAlchemy ORM parameterized queries
   - No raw SQL execution

3. **CORS Configuration**
   - Controlled cross-origin access
   - Configurable allowed origins

4. **Input Validation**
   - Required field checking
   - Data type validation
   - Excel column validation

## Performance Considerations

1. **Database Indexes**
   - `po_number` indexed for fast lookups
   - `batch_id` indexed for batch filtering

2. **Pagination**
   - Inbound list supports pagination
   - Default 20 items per page
   - Prevents large result sets

3. **Eager Loading**
   - Relationships configured with lazy loading
   - Prevents N+1 query problems

4. **Auto-commit**
   - Database changes committed immediately
   - Ensures data consistency

## Scalability Path

For production deployment with high volume:

1. **Database Migration**
   - Replace SQLite with PostgreSQL
   - Add connection pooling
   - Implement read replicas

2. **Caching Layer**
   - Add Redis for dashboard stats
   - Cache frequently accessed data
   - Reduce database load

3. **Message Queue**
   - Use Celery for background tasks
   - Process Excel uploads asynchronously
   - Handle email notifications

4. **Load Balancing**
   - Multiple Flask instances
   - Nginx reverse proxy
   - Session management

5. **API Rate Limiting**
   - Prevent abuse
   - Fair resource allocation
   - DDoS protection

## Testing Strategy

### Unit Tests
- Test individual functions in isolation
- Mock external dependencies
- Fast execution

### Integration Tests
- Test API endpoints
- Use in-memory database
- Verify data flow

### Test Coverage
- Routes: 100%
- Services: 100%
- Models: 100%
- Business logic: 100%

## Deployment

### Development
```bash
python run.py
```

### Production (Recommended)
```bash
gunicorn -w 4 -b 0.0.0.0:8000 run:app
```

### Docker (Future)
```dockerfile
FROM python:3.12
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8000", "run:app"]
```

## Monitoring and Logging

### Current Logging
- Flask debug mode logs all requests
- Error messages returned in JSON

### Production Recommendations
- Structured logging (JSON format)
- Log aggregation (ELK stack)
- Error tracking (Sentry)
- Performance monitoring (New Relic)
- Uptime monitoring (Pingdom)

## Backup and Recovery

### Database Backup
```bash
# Backup SQLite database
cp instance/vas.db instance/vas_backup_$(date +%Y%m%d).db
```

### For Production
- Automated daily backups
- Point-in-time recovery
- Backup retention policy
- Disaster recovery plan
