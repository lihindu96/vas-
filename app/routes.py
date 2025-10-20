"""
API Routes for VAS module
"""
from flask import Blueprint, request, jsonify, render_template
from . import db
from .models import Inbound, VASTask, Outbound, VASStatus
from .services import (
    process_excel_upload, 
    update_vas_task_status, 
    get_dashboard_stats,
    get_inbound_with_tasks
)

vas_bp = Blueprint('vas', __name__)

@vas_bp.route('/')
def index():
    """Render dashboard"""
    return render_template('dashboard.html')

@vas_bp.route('/api/upload/inbound', methods=['POST'])
def upload_inbound():
    """Upload Excel file with inbound data"""
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'No file selected'}), 400
    
    from flask import current_app
    success, message, records = process_excel_upload(file, current_app.config['UPLOAD_FOLDER'])
    
    if success:
        return jsonify({
            'success': True, 
            'message': message,
            'records_created': records
        }), 201
    else:
        return jsonify({'success': False, 'message': message}), 400

@vas_bp.route('/api/inbound', methods=['GET'])
def get_inbound_list():
    """Get list of all inbound items"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    batch_id = request.args.get('batch_id', None)
    
    query = Inbound.query
    if batch_id:
        query = query.filter_by(batch_id=batch_id)
    
    pagination = query.order_by(Inbound.received_date.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'items': [item.to_dict() for item in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    })

@vas_bp.route('/api/inbound/<int:inbound_id>', methods=['GET'])
def get_inbound_detail(inbound_id):
    """Get detailed inbound item with VAS tasks"""
    result = get_inbound_with_tasks(inbound_id)
    if result:
        return jsonify(result)
    return jsonify({'message': 'Inbound item not found'}), 404

@vas_bp.route('/api/vas/tasks', methods=['GET'])
def get_vas_tasks():
    """Get VAS tasks with optional filtering"""
    status = request.args.get('status', None)
    inbound_id = request.args.get('inbound_id', None, type=int)
    task_type = request.args.get('task_type', None)
    
    query = VASTask.query
    if status:
        query = query.filter_by(status=status)
    if inbound_id:
        query = query.filter_by(inbound_id=inbound_id)
    if task_type:
        query = query.filter_by(task_type=task_type)
    
    tasks = query.all()
    return jsonify([task.to_dict() for task in tasks])

@vas_bp.route('/api/vas/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    """Update VAS task status"""
    data = request.json
    
    if 'status' not in data:
        return jsonify({'success': False, 'message': 'Status is required'}), 400
    
    success, message = update_vas_task_status(
        task_id,
        data['status'],
        data.get('assigned_to'),
        data.get('notes')
    )
    
    if success:
        return jsonify({'success': True, 'message': message})
    return jsonify({'success': False, 'message': message}), 404

@vas_bp.route('/api/outbound', methods=['GET'])
def get_outbound_list():
    """Get list of outbound items ready for dispatch"""
    ready_only = request.args.get('ready_only', 'true').lower() == 'true'
    
    query = Outbound.query
    if ready_only:
        query = query.filter_by(ready_for_dispatch=True, dispatched_at=None)
    
    outbound_items = query.order_by(Outbound.created_at.desc()).all()
    return jsonify([item.to_dict() for item in outbound_items])

@vas_bp.route('/api/dashboard/stats', methods=['GET'])
def dashboard_stats():
    """Get dashboard statistics"""
    stats = get_dashboard_stats()
    return jsonify(stats)

@vas_bp.route('/api/batches', methods=['GET'])
def get_batches():
    """Get list of all batches"""
    batches = db.session.query(Inbound.batch_id).distinct().all()
    batch_list = [{'batch_id': b[0]} for b in batches if b[0]]
    return jsonify(batch_list)
