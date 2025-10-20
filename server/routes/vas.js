const express = require('express');
const router = express.Router();
const dataStore = require('../models/dataStore');

// Get all VAS tasks
router.get('/tasks', (req, res) => {
  try {
    const tasks = dataStore.getVASTasks();
    res.json(tasks);
  } catch (error) {
    console.error('Error getting tasks:', error);
    res.status(500).json({ error: 'Failed to retrieve tasks' });
  }
});

// Get all inbound items
router.get('/inbound', (req, res) => {
  try {
    const items = dataStore.getInboundItems();
    res.json(items);
  } catch (error) {
    console.error('Error getting inbound items:', error);
    res.status(500).json({ error: 'Failed to retrieve inbound items' });
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

    // Validate and sanitize inputs
    const sanitizedAssignedTo = assignedTo ? String(assignedTo).substring(0, 100) : '';
    const sanitizedNotes = notes ? String(notes).substring(0, 1000) : '';

    const task = dataStore.createVASTask({
      inboundItemId: String(inboundItemId),
      taskType,
      assignedTo: sanitizedAssignedTo,
      notes: sanitizedNotes
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
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
    console.error('Error starting task:', error);
    res.status(500).json({ error: 'Failed to start task' });
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
    console.error('Error completing task:', error);
    res.status(500).json({ error: 'Failed to complete task' });
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
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Get tasks for a specific inbound item
router.get('/inbound/:id/tasks', (req, res) => {
  try {
    const tasks = dataStore.getVASTasksByInboundItem(req.params.id);
    res.json(tasks);
  } catch (error) {
    console.error('Error getting tasks for inbound item:', error);
    res.status(500).json({ error: 'Failed to retrieve tasks' });
  }
});

module.exports = router;
