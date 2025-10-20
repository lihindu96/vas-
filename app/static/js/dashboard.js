// API base URL
const API_BASE = '';

// Auto-refresh interval (30 seconds)
const REFRESH_INTERVAL = 30000;
let refreshTimer;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    setupUploadForm();
    loadDashboardStats();
    loadInboundItems();
    loadOutboundItems();
    loadBatches();
    setupModal();
    
    // Auto-refresh
    refreshTimer = setInterval(() => {
        loadDashboardStats();
        loadInboundItems();
        loadOutboundItems();
    }, REFRESH_INTERVAL);
});

// Setup upload form
function setupUploadForm() {
    const form = document.getElementById('uploadForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fileInput = document.getElementById('fileInput');
        const file = fileInput.files[0];
        
        if (!file) {
            showMessage('Please select a file', 'error');
            return;
        }
        
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const response = await fetch(`${API_BASE}/api/upload/inbound`, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                showMessage(data.message, 'success');
                fileInput.value = '';
                // Refresh data
                setTimeout(() => {
                    loadDashboardStats();
                    loadInboundItems();
                    loadBatches();
                }, 1000);
            } else {
                showMessage(data.message, 'error');
            }
        } catch (error) {
            showMessage('Error uploading file: ' + error.message, 'error');
        }
    });
}

// Show message
function showMessage(message, type) {
    const messageDiv = document.getElementById('uploadMessage');
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        const response = await fetch(`${API_BASE}/api/dashboard/stats`);
        const stats = await response.json();
        
        document.getElementById('totalInbound').textContent = stats.total_inbound;
        document.getElementById('pendingTasks').textContent = stats.pending_tasks;
        document.getElementById('inProgressTasks').textContent = stats.in_progress_tasks;
        document.getElementById('completedTasks').textContent = stats.completed_tasks;
        document.getElementById('completionPercentage').textContent = stats.completion_percentage + '%';
        document.getElementById('totalOutbound').textContent = stats.total_outbound;
        
        // Update batches
        const batchesList = document.getElementById('batchesList');
        batchesList.innerHTML = '';
        stats.current_batches.forEach(batch => {
            const batchDiv = document.createElement('div');
            batchDiv.className = 'batch-item';
            batchDiv.textContent = batch;
            batchesList.appendChild(batchDiv);
        });
        
        if (stats.current_batches.length === 0) {
            batchesList.innerHTML = '<p>No batches currently being processed</p>';
        }
        
        // Update task breakdown
        const taskBreakdown = document.getElementById('taskBreakdown');
        taskBreakdown.innerHTML = '';
        
        for (const [taskType, counts] of Object.entries(stats.task_breakdown)) {
            const card = document.createElement('div');
            card.className = 'task-type-card';
            card.innerHTML = `
                <h3>${taskType}</h3>
                <div class="task-status-row">
                    <span class="status-label">Pending:</span>
                    <span class="status-count">${counts.pending}</span>
                </div>
                <div class="task-status-row">
                    <span class="status-label">In Progress:</span>
                    <span class="status-count">${counts.in_progress}</span>
                </div>
                <div class="task-status-row">
                    <span class="status-label">Completed:</span>
                    <span class="status-count">${counts.completed}</span>
                </div>
            `;
            taskBreakdown.appendChild(card);
        }
        
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Load inbound items
async function loadInboundItems() {
    try {
        const batchFilter = document.getElementById('batchFilter').value;
        let url = `${API_BASE}/api/inbound`;
        if (batchFilter) {
            url += `?batch_id=${encodeURIComponent(batchFilter)}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        const tbody = document.getElementById('inboundTableBody');
        tbody.innerHTML = '';
        
        data.items.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.id}</td>
                <td>${item.po_number}</td>
                <td>${item.item_code}</td>
                <td>${item.item_description}</td>
                <td>${item.quantity}</td>
                <td>${item.supplier}</td>
                <td>${item.batch_id || 'N/A'}</td>
                <td>
                    <button onclick="showTaskDetails(${item.id}, '${item.item_code}')">View Tasks</button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        if (data.items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center">No inbound items found</td></tr>';
        }
        
    } catch (error) {
        console.error('Error loading inbound items:', error);
    }
}

// Load batches for filter
async function loadBatches() {
    try {
        const response = await fetch(`${API_BASE}/api/batches`);
        const batches = await response.json();
        
        const select = document.getElementById('batchFilter');
        const currentValue = select.value;
        select.innerHTML = '<option value="">All Batches</option>';
        
        batches.forEach(batch => {
            const option = document.createElement('option');
            option.value = batch.batch_id;
            option.textContent = batch.batch_id;
            select.appendChild(option);
        });
        
        select.value = currentValue;
    } catch (error) {
        console.error('Error loading batches:', error);
    }
}

// Load outbound items
async function loadOutboundItems() {
    try {
        const response = await fetch(`${API_BASE}/api/outbound`);
        const items = await response.json();
        
        const tbody = document.getElementById('outboundTableBody');
        tbody.innerHTML = '';
        
        items.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.id}</td>
                <td>${item.item_code}</td>
                <td>${item.item_description}</td>
                <td>${item.quantity}</td>
                <td>${new Date(item.created_at).toLocaleString()}</td>
                <td><span class="status-badge status-completed">Ready for Dispatch</span></td>
            `;
            tbody.appendChild(row);
        });
        
        if (items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">No items ready for dispatch</td></tr>';
        }
        
    } catch (error) {
        console.error('Error loading outbound items:', error);
    }
}

// Show task details modal
async function showTaskDetails(inboundId, itemCode) {
    try {
        const response = await fetch(`${API_BASE}/api/inbound/${inboundId}`);
        const data = await response.json();
        
        document.getElementById('modalItemCode').textContent = itemCode;
        
        const tasksList = document.getElementById('tasksList');
        tasksList.innerHTML = '';
        
        data.vas_tasks.forEach(task => {
            const taskDiv = document.createElement('div');
            taskDiv.className = 'task-item';
            
            const statusClass = task.status.toLowerCase().replace(' ', '-');
            const timeTaken = task.time_taken ? `${Math.round(task.time_taken)} seconds` : 'N/A';
            
            taskDiv.innerHTML = `
                <h4>${task.task_type}</h4>
                <div class="task-detail">
                    <strong>Status:</strong>
                    <span class="status-badge status-${statusClass}">${task.status}</span>
                </div>
                <div class="task-detail">
                    <strong>Assigned To:</strong>
                    <span>${task.assigned_to || 'Unassigned'}</span>
                </div>
                <div class="task-detail">
                    <strong>Time Taken:</strong>
                    <span>${timeTaken}</span>
                </div>
                ${task.notes ? `<div class="task-detail"><strong>Notes:</strong> ${task.notes}</div>` : ''}
                <div class="task-actions">
                    ${task.status === 'Pending' ? 
                        `<button class="btn-start" onclick="updateTaskStatus(${task.id}, 'In Progress')">Start Task</button>` : ''}
                    ${task.status === 'In Progress' ? 
                        `<button class="btn-complete" onclick="updateTaskStatus(${task.id}, 'Completed')">Mark Complete</button>` : ''}
                </div>
            `;
            tasksList.appendChild(taskDiv);
        });
        
        document.getElementById('taskModal').style.display = 'block';
        
    } catch (error) {
        console.error('Error loading task details:', error);
    }
}

// Update task status
async function updateTaskStatus(taskId, status) {
    try {
        const response = await fetch(`${API_BASE}/api/vas/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: status })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Refresh the modal and dashboard
            loadDashboardStats();
            loadOutboundItems();
            
            // Find the inbound ID from the current modal and refresh
            const modal = document.getElementById('taskModal');
            if (modal.style.display === 'block') {
                const itemCode = document.getElementById('modalItemCode').textContent;
                // Re-fetch to get inbound ID - simplified approach: just close and notify
                alert(data.message);
                modal.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error updating task status:', error);
        alert('Error updating task status');
    }
}

// Setup modal
function setupModal() {
    const modal = document.getElementById('taskModal');
    const closeBtn = document.querySelector('.close');
    
    closeBtn.onclick = function() {
        modal.style.display = 'none';
    };
    
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}
