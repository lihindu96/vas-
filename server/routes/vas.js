const express = require('express');
const router = express.Router();
const dataStore = require('../models/dataStore');

// Get all VAS tasks
router.get('/tasks', (req, res) => {
  try {
    const tasks = dataStore.getVASTasks();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all inbound items
router.get('/inbound', (req, res) => {
  try {
    const items = dataStore.getInboundItems();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new VAS task
router.post('/tasks', (req, res) => {
  try {
    const { inboundItemId, taskType, assignedTo, notes } = req.body;

    if (!inboundItemId || !taskType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['LABELING', 'REPACKING', 'QC'].includes(taskType)) {
      return res.status(400).json({ error: 'Invalid task type' });
    }

    const task = dataStore.createVASTask({
      inboundItemId,
      taskType,
      assignedTo,
      notes
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start a VAS task
router.patch('/tasks/:id/start', (req, res) => {
  try {
    const task = dataStore.startVASTask(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Complete a VAS task
router.patch('/tasks/:id/complete', (req, res) => {
  try {
    const task = dataStore.completeVASTask(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a VAS task
router.patch('/tasks/:id', (req, res) => {
  try {
    const task = dataStore.updateVASTask(req.params.id, req.body);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get tasks for a specific inbound item
router.get('/inbound/:id/tasks', (req, res) => {
  try {
    const tasks = dataStore.getVASTasksByInboundItem(req.params.id);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
