"""
Database models for VAS module
"""
from . import db
from datetime import datetime
from enum import Enum

class VASStatus(Enum):
    PENDING = "Pending"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"

class VASTaskType(Enum):
    LABELING = "Labeling"
    REPACKING = "Repacking"
    QUALITY_CHECKING = "Quality Checking"
    BARCODING = "Barcoding"

class Inbound(db.Model):
    """Inbound shipment data"""
    __tablename__ = 'inbound'
    
    id = db.Column(db.Integer, primary_key=True)
    po_number = db.Column(db.String(100), nullable=False, index=True)
    item_code = db.Column(db.String(100), nullable=False)
    item_description = db.Column(db.String(500))
    quantity = db.Column(db.Integer, nullable=False)
    supplier = db.Column(db.String(200))
    received_date = db.Column(db.DateTime, default=datetime.utcnow)
    batch_id = db.Column(db.String(100), index=True)
    
    # Relationships
    vas_tasks = db.relationship('VASTask', backref='inbound_item', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'po_number': self.po_number,
            'item_code': self.item_code,
            'item_description': self.item_description,
            'quantity': self.quantity,
            'supplier': self.supplier,
            'received_date': self.received_date.isoformat(),
            'batch_id': self.batch_id
        }

class VASTask(db.Model):
    """VAS processing tasks"""
    __tablename__ = 'vas_task'
    
    id = db.Column(db.Integer, primary_key=True)
    inbound_id = db.Column(db.Integer, db.ForeignKey('inbound.id'), nullable=False)
    task_type = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(20), default=VASStatus.PENDING.value)
    assigned_to = db.Column(db.String(100))
    started_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    notes = db.Column(db.Text)
    
    def to_dict(self):
        time_taken = None
        if self.started_at and self.completed_at:
            time_taken = (self.completed_at - self.started_at).total_seconds()
        
        return {
            'id': self.id,
            'inbound_id': self.inbound_id,
            'task_type': self.task_type,
            'status': self.status,
            'assigned_to': self.assigned_to,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'time_taken': time_taken,
            'notes': self.notes
        }

class Outbound(db.Model):
    """Outbound orders automatically created from completed VAS items"""
    __tablename__ = 'outbound'
    
    id = db.Column(db.Integer, primary_key=True)
    inbound_id = db.Column(db.Integer, db.ForeignKey('inbound.id'), nullable=False)
    item_code = db.Column(db.String(100), nullable=False)
    item_description = db.Column(db.String(500))
    quantity = db.Column(db.Integer, nullable=False)
    ready_for_dispatch = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    dispatched_at = db.Column(db.DateTime)
    
    # Relationship
    inbound = db.relationship('Inbound', backref='outbound_orders', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'inbound_id': self.inbound_id,
            'item_code': self.item_code,
            'item_description': self.item_description,
            'quantity': self.quantity,
            'ready_for_dispatch': self.ready_for_dispatch,
            'created_at': self.created_at.isoformat(),
            'dispatched_at': self.dispatched_at.isoformat() if self.dispatched_at else None
        }
