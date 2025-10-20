"""
Service layer for VAS operations
"""
import pandas as pd
from datetime import datetime
from werkzeug.utils import secure_filename
from . import db
from .models import Inbound, VASTask, Outbound, VASStatus, VASTaskType
import os

def allowed_file(filename):
    """Check if uploaded file has allowed extension"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'xlsx', 'xls'}

def process_excel_upload(file, upload_folder):
    """
    Process Excel file and create inbound records
    Returns: (success, message, records_created)
    """
    if not allowed_file(file.filename):
        return False, "Invalid file type. Please upload an Excel file (.xlsx or .xls)", 0
    
    filename = secure_filename(file.filename)
    filepath = os.path.join(upload_folder, filename)
    file.save(filepath)
    
    try:
        # Read Excel file
        df = pd.read_excel(filepath)
        
        # Validate required columns
        required_columns = ['PO Number', 'Item Code', 'Quantity']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            os.remove(filepath)
            return False, f"Missing required columns: {', '.join(missing_columns)}", 0
        
        records_created = 0
        batch_id = f"BATCH-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        
        # Process each row
        for _, row in df.iterrows():
            inbound = Inbound(
                po_number=str(row['PO Number']),
                item_code=str(row['Item Code']),
                item_description=str(row.get('Item Description', '')),
                quantity=int(row['Quantity']),
                supplier=str(row.get('Supplier', '')),
                batch_id=batch_id
            )
            db.session.add(inbound)
            db.session.flush()  # Get the ID
            
            # Create default VAS tasks for each inbound item
            for task_type in VASTaskType:
                vas_task = VASTask(
                    inbound_id=inbound.id,
                    task_type=task_type.value,
                    status=VASStatus.PENDING.value
                )
                db.session.add(vas_task)
            
            records_created += 1
        
        db.session.commit()
        
        # Clean up uploaded file
        os.remove(filepath)
        
        return True, f"Successfully processed {records_created} records in batch {batch_id}", records_created
        
    except Exception as e:
        db.session.rollback()
        if os.path.exists(filepath):
            os.remove(filepath)
        # Log the error for debugging but don't expose details to users
        import logging
        logging.error(f"Error processing Excel file: {str(e)}", exc_info=True)
        return False, "Error processing file. Please check the file format and try again.", 0

def update_vas_task_status(task_id, status, assigned_to=None, notes=None):
    """
    Update VAS task status
    Automatically creates outbound record when all tasks for an item are completed
    """
    task = VASTask.query.get(task_id)
    if not task:
        return False, "Task not found"
    
    task.status = status
    if assigned_to:
        task.assigned_to = assigned_to
    if notes:
        task.notes = notes
    
    # Update timestamps
    if status == VASStatus.IN_PROGRESS.value and not task.started_at:
        task.started_at = datetime.utcnow()
    elif status == VASStatus.COMPLETED.value and not task.completed_at:
        task.completed_at = datetime.utcnow()
    
    db.session.commit()
    
    # Check if all tasks for this inbound item are completed
    inbound_item = Inbound.query.get(task.inbound_id)
    all_tasks = VASTask.query.filter_by(inbound_id=task.inbound_id).all()
    all_completed = all(t.status == VASStatus.COMPLETED.value for t in all_tasks)
    
    if all_completed:
        # Check if outbound record already exists
        existing_outbound = Outbound.query.filter_by(inbound_id=task.inbound_id).first()
        if not existing_outbound:
            # Create outbound record
            outbound = Outbound(
                inbound_id=inbound_item.id,
                item_code=inbound_item.item_code,
                item_description=inbound_item.item_description,
                quantity=inbound_item.quantity,
                ready_for_dispatch=True
            )
            db.session.add(outbound)
            db.session.commit()
            return True, "Task updated and item moved to outbound"
    
    return True, "Task updated successfully"

def get_dashboard_stats():
    """
    Get statistics for the dashboard
    """
    # Total inbound items
    total_inbound = Inbound.query.count()
    
    # VAS task statistics
    total_tasks = VASTask.query.count()
    pending_tasks = VASTask.query.filter_by(status=VASStatus.PENDING.value).count()
    in_progress_tasks = VASTask.query.filter_by(status=VASStatus.IN_PROGRESS.value).count()
    completed_tasks = VASTask.query.filter_by(status=VASStatus.COMPLETED.value).count()
    
    # Completion percentage
    completion_percentage = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
    
    # Total outbound ready
    total_outbound = Outbound.query.count()
    
    # Current batches being processed
    batches = db.session.query(Inbound.batch_id).distinct().all()
    batch_list = [b[0] for b in batches if b[0]]
    
    # Task breakdown by type
    task_breakdown = {}
    for task_type in VASTaskType:
        task_breakdown[task_type.value] = {
            'pending': VASTask.query.filter_by(task_type=task_type.value, status=VASStatus.PENDING.value).count(),
            'in_progress': VASTask.query.filter_by(task_type=task_type.value, status=VASStatus.IN_PROGRESS.value).count(),
            'completed': VASTask.query.filter_by(task_type=task_type.value, status=VASStatus.COMPLETED.value).count()
        }
    
    return {
        'total_inbound': total_inbound,
        'total_tasks': total_tasks,
        'pending_tasks': pending_tasks,
        'in_progress_tasks': in_progress_tasks,
        'completed_tasks': completed_tasks,
        'completion_percentage': round(completion_percentage, 2),
        'total_outbound': total_outbound,
        'current_batches': batch_list,
        'task_breakdown': task_breakdown
    }

def get_inbound_with_tasks(inbound_id):
    """Get inbound item with all its VAS tasks"""
    inbound = Inbound.query.get(inbound_id)
    if not inbound:
        return None
    
    result = inbound.to_dict()
    result['vas_tasks'] = [task.to_dict() for task in inbound.vas_tasks]
    result['outbound'] = [o.to_dict() for o in inbound.outbound_orders]
    
    return result
