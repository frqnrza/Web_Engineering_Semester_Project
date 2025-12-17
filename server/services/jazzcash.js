const crypto = require('crypto');

class JazzCashService {
  constructor() {
    this.merchantId = process.env.JAZZCASH_MERCHANT_ID || 'MC00000';
    this.password = process.env.JAZZCASH_PASSWORD || 'password';
    this.integritySalt = process.env.JAZZCASH_SALT || 'salt';
    this.returnUrl = process.env.JAZZCASH_RETURN_URL || 'http://localhost:5173/payment/callback';
    this.apiUrl = process.env.JAZZCASH_API_URL || 'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform';
  }

  /**
   * Generate secure hash for JazzCash transaction
   */
  generateHash(data) {
    // Sort keys alphabetically and create string
    const sortedKeys = Object.keys(data).sort();
    const sortedString = sortedKeys
      .map(key => data[key])
      .join('&');

    // Add integrity salt
    const stringToHash = this.integritySalt + '&' + sortedString;

    // Generate HMAC SHA256 hash
    return crypto
      .createHmac('sha256', this.integritySalt)
      .update(stringToHash)
      .digest('hex')
      .toUpperCase();
  }

  /**
   * Get expiry date time (1 hour from now)
   */
  getExpiryDateTime() {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString()
      .replace(/[-:]/g, '')
      .split('.')[0];
  }

  /**
   * Get current date time in JazzCash format
   */
  getCurrentDateTime() {
    return new Date().toISOString()
      .replace(/[-:]/g, '')
      .split('.')[0];
  }

  /**
   * Initiate payment
   * @param {number} amount - Amount in PKR
   * @param {string} orderId - Unique order ID
   * @param {string} customerPhone - Customer phone number (03XXXXXXXXX)
   * @param {string} customerEmail - Customer email
   */
  async initiatePayment(amount, orderId, customerPhone, customerEmail) {
    try {
      // Convert amount to paisa (smallest currency unit)
      const amountInPaisa = Math.round(amount * 100);

      // Prepare transaction data
      const transactionData = {
        pp_Version: '1.1',
        pp_TxnType: 'MWALLET',
        pp_Language: 'EN',
        pp_MerchantID: this.merchantId,
        pp_SubMerchantID: '',
        pp_Password: this.password,
        pp_BankID: '',
        pp_ProductID: '',
        pp_TxnRefNo: orderId,
        pp_Amount: amountInPaisa,
        pp_TxnCurrency: 'PKR',
        pp_TxnDateTime: this.getCurrentDateTime(),
        pp_BillReference: orderId,
        pp_Description: 'TechConnect Project Payment',
        pp_TxnExpiryDateTime: this.getExpiryDateTime(),
        pp_ReturnURL: this.returnUrl,
        pp_SecureHash: '',
        ppmpf_1: customerPhone,
        ppmpf_2: customerEmail,
        ppmpf_3: '',
        ppmpf_4: '',
        ppmpf_5: ''
      };

      // Generate secure hash
      transactionData.pp_SecureHash = this.generateHash(transactionData);

      return {
        success: true,
        transactionData,
        apiUrl: this.apiUrl,
        message: 'Payment data prepared successfully'
      };
    } catch (error) {
      console.error('JazzCash initiate payment error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify payment callback
   */
  verifyPaymentResponse(responseData) {
    try {
      const receivedHash = responseData.pp_SecureHash;
      
      // Remove hash from data for verification
      const dataToVerify = { ...responseData };
      delete dataToVerify.pp_SecureHash;

      // Generate hash with received data
      const calculatedHash = this.generateHash(dataToVerify);

      // Verify hash matches
      if (receivedHash !== calculatedHash) {
        return {
          success: false,
          message: 'Invalid payment response'
        };
      }

      // Check response code
      if (responseData.pp_ResponseCode === '000') {
        return {
          success: true,
          message: 'Payment successful',
          transactionId: responseData.pp_TxnRefNo
        };
      } else {
        return {
          success: false,
          message: responseData.pp_ResponseMessage || 'Payment failed'
        };
      }
    } catch (error) {
      console.error('JazzCash verify payment error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Inquiry transaction status
   */
  async inquiryTransaction(transactionId) {
    // This would call JazzCash inquiry API
    // Implementation depends on your JazzCash merchant agreement
    console.log('Inquiry transaction:', transactionId);
    
    return {
      success: true,
      message: 'This is a mock inquiry. Implement real API call.'
    };
  }
}

module.exports = new JazzCashService();