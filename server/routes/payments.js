const express = require('express');
const router = express.Router();
const jazzCashService = require('../services/jazzcash');
const { authMiddleware } = require('../middleware/auth');
const Project = require('../models/Project');

// Initiate payment for a project
router.post('/initiate', authMiddleware, async (req, res) => {
  try {
    const { projectId, amount, phone, email } = req.body;

    // Verify project exists and user is authorized
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Generate unique order ID
    const orderId = `PROJ_${projectId}_${Date.now()}`;

    // Initiate JazzCash payment
    const paymentData = await jazzCashService.initiatePayment(
      amount,
      orderId,
      phone,
      email
    );

    if (!paymentData.success) {
      return res.status(400).json({ 
        error: 'Payment initiation failed',
        details: paymentData.error 
      });
    }

    // Store payment record in database (optional)
    // await Payment.create({ ... });

    res.json({
      success: true,
      paymentData: paymentData.transactionData,
      apiUrl: paymentData.apiUrl,
      orderId
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
});

// Handle payment callback from JazzCash
router.post('/callback', async (req, res) => {
  try {
    const paymentResponse = req.body;

    // Verify payment response
    const verification = jazzCashService.verifyPaymentResponse(paymentResponse);

    if (verification.success) {
      // Payment successful
      // Update project status, send notifications, etc.
      
      // Redirect to success page
      res.redirect(`${process.env.CLIENT_URL}/payment/success?orderId=${paymentResponse.pp_TxnRefNo}`);
    } else {
      // Payment failed
      res.redirect(`${process.env.CLIENT_URL}/payment/failed?reason=${verification.message}`);
    }
  } catch (error) {
    console.error('Payment callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}/payment/error`);
  }
});

// Check payment status
router.get('/status/:orderId', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Query your payment records
    // const payment = await Payment.findOne({ orderId });
    
    res.json({ 
      success: true,
      status: 'completed', // or 'pending', 'failed'
      orderId 
    });
  } catch (error) {
    console.error('Payment status error:', error);
    res.status(500).json({ error: 'Failed to check payment status' });
  }
});

module.exports = router;