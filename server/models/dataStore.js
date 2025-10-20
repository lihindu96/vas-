const { v4: uuidv4 } = require('uuid');

// In-memory storage (in production, this would be a database)
let inboundItems = [];
let vasTasks = [];

class InboundItem {
  constructor(data) {
    this.id = uuidv4();
    this.poNumber = data.poNumber || '';
    this.itemCode = data.itemCode || '';
    this.itemDescription = data.itemDescription || '';
    this.quantity = data.quantity || 0;
    this.status = 'INBOUND';
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }
}

class VASTask {
  constructor(data) {
    this.id = uuidv4();
    this.inboundItemId = data.inboundItemId;
    this.taskType = data.taskType; // 'LABELING', 'REPACKING', 'QC'
    this.status = 'PENDING'; // 'PENDING', 'IN_PROGRESS', 'COMPLETED'
    this.assignedTo = data.assignedTo || '';
    this.startedAt = null;
    this.completedAt = null;
    this.notes = data.notes || '';
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  start() {
    this.status = 'IN_PROGRESS';
    this.startedAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  complete() {
    this.status = 'COMPLETED';
    this.completedAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }
}

// Data access functions
const dataStore = {
  // Inbound Items
  createInboundItem(data) {
    const item = new InboundItem(data);
    inboundItems.push(item);
    return item;
  },

  getInboundItems() {
    return inboundItems;
  },

  getInboundItemById(id) {
    return inboundItems.find(item => item.id === id);
  },

  updateInboundItemStatus(id, status) {
    const item = inboundItems.find(item => item.id === id);
    if (item) {
      item.status = status;
      item.updatedAt = new Date().toISOString();
    }
    return item;
  },

  // VAS Tasks
  createVASTask(data) {
    const task = new VASTask(data);
    vasTasks.push(task);
    return task;
  },

  getVASTasks() {
    return vasTasks;
  },

  getVASTaskById(id) {
    return vasTasks.find(task => task.id === id);
  },

  getVASTasksByInboundItem(inboundItemId) {
    return vasTasks.filter(task => task.inboundItemId === inboundItemId);
  },

  updateVASTask(id, updates) {
    const task = vasTasks.find(task => task.id === id);
    if (task) {
      Object.assign(task, updates);
      task.updatedAt = new Date().toISOString();
    }
    return task;
  },

  startVASTask(id) {
    const task = vasTasks.find(task => task.id === id);
    if (task) {
      task.start();
    }
    return task;
  },

  completeVASTask(id) {
    const task = vasTasks.find(task => task.id === id);
    if (task) {
      task.complete();
      
      // Check if all tasks for the inbound item are completed
      const allTasks = this.getVASTasksByInboundItem(task.inboundItemId);
      const allCompleted = allTasks.every(t => t.status === 'COMPLETED');
      
      if (allCompleted) {
        // Auto-update inbound item to OUTBOUND status
        this.updateInboundItemStatus(task.inboundItemId, 'OUTBOUND');
      }
    }
    return task;
  },

  // Statistics
  getStatistics() {
    const totalInbound = inboundItems.length;
    const totalTasks = vasTasks.length;
    const completedTasks = vasTasks.filter(t => t.status === 'COMPLETED').length;
    const inProgressTasks = vasTasks.filter(t => t.status === 'IN_PROGRESS').length;
    const pendingTasks = vasTasks.filter(t => t.status === 'PENDING').length;
    const outboundItems = inboundItems.filter(i => i.status === 'OUTBOUND').length;

    return {
      totalInbound,
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      outboundItems,
      completionRate: totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0
    };
  }
};

module.exports = dataStore;
