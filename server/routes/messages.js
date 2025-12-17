const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { authMiddleware } = require('../middleware/auth');

// Get conversation messages
router.get('/:conversationId', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({ 
      conversationId: req.params.conversationId 
    })
    .sort({ createdAt: 1 })
    .limit(100); // Limit to last 100 messages

    res.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send message
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { conversationId, receiverId, content, attachments } = req.body;

    const message = new Message({
      conversationId,
      senderId: req.userId,
      receiverId,
      senderName: req.userName || 'User', // You might want to get this from user model
      content,
      attachments,
      read: false
    });

    await message.save();

    res.status(201).json({ 
      message,
      success: true 
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Mark messages as read
router.put('/:conversationId/read', authMiddleware, async (req, res) => {
  try {
    await Message.updateMany(
      { 
        conversationId: req.params.conversationId,
        receiverId: req.userId,
        read: false 
      },
      { read: true }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Get all conversations for user
router.get('/user/conversations', authMiddleware, async (req, res) => {
  try {
    // Get distinct conversation IDs where user is sender or receiver
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: req.userId },
            { receiverId: req.userId }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $eq: ['$receiverId', req.userId] },
                    { $eq: ['$read', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

module.exports = router;