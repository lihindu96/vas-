"""
Tests for VAS module
"""
import pytest
import os
import sys
from io import BytesIO
import pandas as pd

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from app.models import Inbound, VASTask, Outbound, VASStatus

@pytest.fixture
def app():
    """Create application for testing"""
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    """Create test client"""
    return app.test_client()

@pytest.fixture
def sample_excel():
    """Create a sample Excel file in memory"""
    data = {
        'PO Number': ['PO-001', 'PO-002'],
        'Item Code': ['ITEM-A001', 'ITEM-B001'],
        'Item Description': ['Widget A', 'Widget B'],
        'Quantity': [100, 200],
        'Supplier': ['Supplier X', 'Supplier Y']
    }
    df = pd.DataFrame(data)
    
    output = BytesIO()
    df.to_excel(output, index=False)
    output.seek(0)
    return output

def test_index_page(client):
    """Test that index page loads"""
    response = client.get('/')
    assert response.status_code == 200
    assert b'VAS Module' in response.data

def test_upload_inbound_success(client, sample_excel, app):
    """Test successful Excel upload"""
    data = {
        'file': (sample_excel, 'test.xlsx')
    }
    
    response = client.post('/api/upload/inbound', 
                          data=data,
                          content_type='multipart/form-data')
    
    assert response.status_code == 201
    json_data = response.get_json()
    assert json_data['success'] is True
    assert json_data['records_created'] == 2
    
    # Verify database records
    with app.app_context():
        assert Inbound.query.count() == 2
        assert VASTask.query.count() == 8  # 2 items * 4 task types

def test_upload_inbound_no_file(client):
    """Test upload without file"""
    response = client.post('/api/upload/inbound')
    assert response.status_code == 400
    json_data = response.get_json()
    assert json_data['success'] is False

def test_get_inbound_list(client, app):
    """Test getting inbound items list"""
    # Create test data
    with app.app_context():
        inbound = Inbound(
            po_number='PO-001',
            item_code='ITEM-001',
            quantity=100,
            batch_id='BATCH-001'
        )
        db.session.add(inbound)
        db.session.commit()
    
    response = client.get('/api/inbound')
    assert response.status_code == 200
    json_data = response.get_json()
    assert len(json_data['items']) == 1
    assert json_data['items'][0]['po_number'] == 'PO-001'

def test_get_inbound_detail(client, app):
    """Test getting detailed inbound item"""
    with app.app_context():
        inbound = Inbound(
            po_number='PO-001',
            item_code='ITEM-001',
            quantity=100
        )
        db.session.add(inbound)
        db.session.flush()
        
        task = VASTask(
            inbound_id=inbound.id,
            task_type='Labeling',
            status='Pending'
        )
        db.session.add(task)
        db.session.commit()
        inbound_id = inbound.id
    
    response = client.get(f'/api/inbound/{inbound_id}')
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['item_code'] == 'ITEM-001'
    assert len(json_data['vas_tasks']) == 1

def test_update_task_status(client, app):
    """Test updating VAS task status"""
    with app.app_context():
        inbound = Inbound(
            po_number='PO-001',
            item_code='ITEM-001',
            quantity=100
        )
        db.session.add(inbound)
        db.session.flush()
        
        task = VASTask(
            inbound_id=inbound.id,
            task_type='Labeling',
            status='Pending'
        )
        db.session.add(task)
        db.session.commit()
        task_id = task.id
    
    response = client.put(f'/api/vas/tasks/{task_id}',
                         json={'status': 'In Progress'})
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['success'] is True
    
    # Verify status update
    with app.app_context():
        task = VASTask.query.get(task_id)
        assert task.status == 'In Progress'
        assert task.started_at is not None

def test_automatic_outbound_creation(client, app):
    """Test that outbound is created when all tasks are completed"""
    with app.app_context():
        # Create inbound item
        inbound = Inbound(
            po_number='PO-001',
            item_code='ITEM-001',
            item_description='Test Item',
            quantity=100
        )
        db.session.add(inbound)
        db.session.flush()
        
        # Create all VAS tasks
        task_types = ['Labeling', 'Repacking', 'Quality Checking', 'Barcoding']
        tasks = []
        for task_type in task_types:
            task = VASTask(
                inbound_id=inbound.id,
                task_type=task_type,
                status='Pending'
            )
            db.session.add(task)
            tasks.append(task)
        
        db.session.commit()
        
        # Complete all tasks except one
        for i, task in enumerate(tasks[:-1]):
            client.put(f'/api/vas/tasks/{task.id}',
                      json={'status': 'Completed'})
        
        # Verify no outbound yet
        assert Outbound.query.count() == 0
        
        # Complete the last task
        client.put(f'/api/vas/tasks/{tasks[-1].id}',
                  json={'status': 'Completed'})
        
        # Verify outbound is created
        assert Outbound.query.count() == 1
        outbound = Outbound.query.first()
        assert outbound.item_code == 'ITEM-001'
        assert outbound.ready_for_dispatch is True

def test_get_dashboard_stats(client, app):
    """Test dashboard statistics endpoint"""
    with app.app_context():
        inbound = Inbound(
            po_number='PO-001',
            item_code='ITEM-001',
            quantity=100,
            batch_id='BATCH-001'
        )
        db.session.add(inbound)
        db.session.flush()
        
        task = VASTask(
            inbound_id=inbound.id,
            task_type='Labeling',
            status='Pending'
        )
        db.session.add(task)
        db.session.commit()
    
    response = client.get('/api/dashboard/stats')
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['total_inbound'] == 1
    assert json_data['pending_tasks'] == 1
    assert 'completion_percentage' in json_data
    assert 'current_batches' in json_data

def test_get_outbound_list(client, app):
    """Test getting outbound items"""
    with app.app_context():
        inbound = Inbound(
            po_number='PO-001',
            item_code='ITEM-001',
            quantity=100
        )
        db.session.add(inbound)
        db.session.flush()
        
        outbound = Outbound(
            inbound_id=inbound.id,
            item_code='ITEM-001',
            item_description='Test Item',
            quantity=100
        )
        db.session.add(outbound)
        db.session.commit()
    
    response = client.get('/api/outbound')
    assert response.status_code == 200
    json_data = response.get_json()
    assert len(json_data) == 1
    assert json_data[0]['item_code'] == 'ITEM-001'

def test_get_batches(client, app):
    """Test getting list of batches"""
    with app.app_context():
        inbound1 = Inbound(
            po_number='PO-001',
            item_code='ITEM-001',
            quantity=100,
            batch_id='BATCH-001'
        )
        inbound2 = Inbound(
            po_number='PO-002',
            item_code='ITEM-002',
            quantity=200,
            batch_id='BATCH-002'
        )
        db.session.add_all([inbound1, inbound2])
        db.session.commit()
    
    response = client.get('/api/batches')
    assert response.status_code == 200
    json_data = response.get_json()
    assert len(json_data) == 2
    batch_ids = [b['batch_id'] for b in json_data]
    assert 'BATCH-001' in batch_ids
    assert 'BATCH-002' in batch_ids
