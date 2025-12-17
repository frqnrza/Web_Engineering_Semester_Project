const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { authMiddleware } = require('../middleware/auth');

// Get user notifications
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { 
      read,
      type,
      priority,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const query = { userId: req.userId };
    
    // Filter by read status
    if (read !== undefined) {
      query.read = read === 'true';
    }
    
    // Filter by type
    if (type) {
      query.type = type;
    }
    
    // Filter by priority
    if (priority) {
      query.priority = priority;
    }
    
    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get notifications
    const notifications = await Notification.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count
    const total = await Notification.countDocuments(query);
    
    // Get unread count
    const unreadCount = await Notification.getUnreadCount(req.userId);
    
    res.json({
      success: true,
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get unread count
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.userId);
    res.json({ success: true, count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// Mark notification as read
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    // Check ownership
    if (notification.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    await notification.markAsRead();
    
    res.json({ 
      success: true, 
      message: 'Notification marked as read' 
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', authMiddleware, async (req, res) => {
  try {
    await Notification.markAllAsRead(req.userId);
    
    res.json({ 
      success: true, 
      message: 'All notifications marked as read' 
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Delete notification
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    // Check ownership
    if (notification.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    await notification.deleteOne();
    
    res.json({ 
      success: true, 
      message: 'Notification deleted' 
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Clear all read notifications
router.delete('/clear-read', authMiddleware, async (req, res) => {
  try {
    await Notification.deleteMany({ 
      userId: req.userId, 
      read: true,
      priority: { $ne: 'urgent' } // Don't delete urgent notifications
    });
    
    res.json({ 
      success: true, 
      message: 'All read notifications cleared' 
    });
  } catch (error) {
    console.error('Clear read notifications error:', error);
    res.status(500).json({ error: 'Failed to clear read notifications' });
  }
});

// Create notification (for testing/admin)
router.post('/', authMiddleware, async (req, res) => {
  try {
    // Only admins or system can create notifications directly
    if (req.userType !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create notifications directly' });
    }
    
    const { userId, type, title, message, data, relatedTo, priority } = req.body;
    
    if (!userId || !type || !title || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const notification = new Notification({
      userId,
      type,
      title,
      message,
      data,
      relatedTo,
      priority: priority || 'medium'
    });
    
    await notification.save();
    
    res.status(201).json({
      success: true,
      notification,
      message: 'Notification created'
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

module.exports = router;