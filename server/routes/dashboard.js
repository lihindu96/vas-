const express = require('express');
const router = express.Router();
const dataStore = require('../models/dataStore');

// Get dashboard statistics
router.get('/stats', (req, res) => {
  try {
    const stats = dataStore.getStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Error getting statistics:', error);
    res.status(500).json({ error: 'Failed to retrieve statistics' });
  }
});

// Get real-time task progress
router.get('/progress', (req, res) => {
  try {
    const inboundItems = dataStore.getInboundItems();
    const tasks = dataStore.getVASTasks();

    const progress = inboundItems.map(item => {
      const itemTasks = tasks.filter(t => t.inboundItemId === item.id);
      const completedTasks = itemTasks.filter(t => t.status === 'COMPLETED').length;
      const totalTasks = itemTasks.length;

      return {
        itemId: item.id,
        poNumber: item.poNumber,
        itemCode: item.itemCode,
        status: item.status,
        tasks: itemTasks,
        progress: totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0,
        totalTasks,
        completedTasks
      };
    });

    res.json(progress);
  } catch (error) {
    console.error('Error getting progress:', error);
    res.status(500).json({ error: 'Failed to retrieve progress' });
  }
});

// Get task breakdown by type
router.get('/task-breakdown', (req, res) => {
  try {
    const tasks = dataStore.getVASTasks();
    
    const breakdown = {
      LABELING: { total: 0, completed: 0, inProgress: 0, pending: 0 },
      REPACKING: { total: 0, completed: 0, inProgress: 0, pending: 0 },
      QC: { total: 0, completed: 0, inProgress: 0, pending: 0 }
    };

    tasks.forEach(task => {
      if (breakdown[task.taskType]) {
        breakdown[task.taskType].total++;
        if (task.status === 'COMPLETED') {
          breakdown[task.taskType].completed++;
        } else if (task.status === 'IN_PROGRESS') {
          breakdown[task.taskType].inProgress++;
        } else {
          breakdown[task.taskType].pending++;
        }
      }
    });

    res.json(breakdown);
  } catch (error) {
    console.error('Error getting task breakdown:', error);
    res.status(500).json({ error: 'Failed to retrieve task breakdown' });
  }
});

module.exports = router;
