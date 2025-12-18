import { useState } from 'react';
import { CreditCard, Smartphone, Building2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { paymentAPI } from '../services/api';
import { translate } from '../services/translations';
import PropTypes from 'prop-types';

export function PaymentModal({ open, onClose, amount, projectId, projectTitle, language }) {
  const [paymentMethod, setPaymentMethod] = useState('jazzcash');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [status, setStatus] = useState('idle');
  const [transactionId, setTransactionId] = useState('');

  const handlePayment = async () => {
    setStatus('processing');

    try {
      // PRODUCTION: Integrate with real APIs
      // JazzCash: https://developer.jazzcash.com.pk/
      // EasyPaisa: Contact EasyPaisa for merchant API
      
      const payment = await paymentAPI.initiatePayment(amount, paymentMethod, projectId);
      
      setTransactionId(payment.transactionId || 'TXN' + Date.now());
      setStatus('success');
      
      // Auto close after 3 seconds on success
      setTimeout(() => {
        onClose();
        resetForm();
      }, 3000);
    } catch (error) {
      console.error('Payment error:', error);
      setStatus('error');
    }
  };

  const resetForm = () => {
    setPaymentMethod('jazzcash');
    setPhoneNumber('');
    setPin('');
    setAccountNumber('');
    setStatus('idle');
    setTransactionId('');
  };

  const handleClose = () => {
    onClose();
    setTimeout(resetForm, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]" aria-describedby="payment-dialog-description">
        <DialogHeader>
          <DialogTitle>
            {status === 'success' 
              ? (language === 'ur' ? 'ادائیگی کامیاب' : 'Payment Successful')
              : status === 'error'
              ? (language === 'ur' ? 'ادائیگی ناکام' : 'Payment Failed')
              : translate('payNow', language)
            }
          </DialogTitle>
          <DialogDescription id="payment-dialog-description">
            {status === 'success' 
              ? (language === 'ur' 
                  ? 'آپ کا لین دین کامیابی سے مکمل ہو گیا ہے'
                  : 'Your transaction has been completed successfully')
              : status === 'error'
              ? (language === 'ur'
                  ? 'لین دین میں ایک خرابی پیش آئی'
                  : 'An error occurred with your transaction')
              : (language === 'ur'
                  ? 'اپنی ادائیگی کو محفوظ طریقے سے مکمل کریں'
                  : 'Complete your payment securely')
            }
          </DialogDescription>
        </DialogHeader>

        {status === 'success' ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {translate('paymentSuccess', language)}
            </h3>
            <p className="text-gray-600 mb-1">
              {language === 'ur' ? 'لین دین ID' : 'Transaction ID'}
            </p>
            <p className="font-mono text-sm text-gray-800 mb-4">{transactionId}</p>
            <p className="text-sm text-gray-600">
              {language === 'ur' 
                ? 'آپ کا پیمنٹ کامیابی سے مکمل ہو گیا'
                : 'Your payment has been processed successfully'}
            </p>
          </div>
        ) : status === 'error' ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {translate('paymentFailed', language)}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {language === 'ur'
                ? 'براہ کرم دوبارہ کوشش کریں یا دوسرا طریقہ استعمال کریں'
                : 'Please try again or use a different payment method'}
            </p>
            <Button onClick={() => setStatus('idle')} className="bg-[#FF8A2B] hover:bg-[#ff7a1b] text-white">
              {translate('retry', language) || 'Retry'}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Project Info */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">{projectTitle}</p>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">{translate('amount', language)}:</span>
                <span className="text-2xl font-semibold text-[#0A2540]">
                  PKR {amount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div>
              <Label className="mb-3 block">{translate('paymentMethod', language)}</Label>
              <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value)}>
                <div className="space-y-3">
                  <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentMethod === 'jazzcash' ? 'border-[#FF8A2B] bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <RadioGroupItem value="jazzcash" id="jazzcash" />
                    <Smartphone className="w-5 h-5 text-red-600" />
                    <div className="flex-1">
                      <p className="font-semibold">JazzCash</p>
                      <p className="text-sm text-gray-600">
                        {language === 'ur' ? 'موبائل والٹ' : 'Mobile Wallet'}
                      </p>
                    </div>
                  </label>

                  <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentMethod === 'easypaisa' ? 'border-[#FF8A2B] bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <RadioGroupItem value="easypaisa" id="easypaisa" />
                    <Smartphone className="w-5 h-5 text-green-600" />
                    <div className="flex-1">
                      <p className="font-semibold">EasyPaisa</p>
                      <p className="text-sm text-gray-600">
                        {language === 'ur' ? 'موبائل والٹ' : 'Mobile Wallet'}
                      </p>
                    </div>
                  </label>

                  <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentMethod === 'bank' ? 'border-[#FF8A2B] bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <RadioGroupItem value="bank" id="bank" />
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="font-semibold">{translate('bankTransfer', language)}</p>
                      <p className="text-sm text-gray-600">
                        {language === 'ur' ? 'براہ راست بینک ٹرانسفر' : 'Direct Bank Transfer'}
                      </p>
                    </div>
                  </label>
                </div>
              </RadioGroup>
            </div>

            {/* Payment Details */}
            {(paymentMethod === 'jazzcash' || paymentMethod === 'easypaisa') && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone">
                    {language === 'ur' ? 'موبائل نمبر' : 'Mobile Number'}
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="03XX-XXXXXXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="pin">
                    {language === 'ur' ? 'MPIN / پاسورڈ' : 'MPIN / Password'}
                  </Label>
                  <Input
                    id="pin"
                    type="password"
                    placeholder="****"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="mt-1"
                    maxLength={4}
                  />
                </div>
              </div>
            )}

            {paymentMethod === 'bank' && (
              <div>
                <Label htmlFor="account">
                  {language === 'ur' ? 'اکاؤنٹ نمبر' : 'Account Number'}
                </Label>
                <Input
                  id="account"
                  type="text"
                  placeholder="PKXX XXXX XXXX XXXX XXXX"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="mt-1"
                />
                <p className="text-sm text-gray-600 mt-2">
                  {language === 'ur'
                    ? 'آپ کو تصدیق کے لیے اپنے بینک ایپ پر ری ڈائریکٹ کیا جائے گا'
                    : 'You will be redirected to your bank app for confirmation'}
                </p>
              </div>
            )}

            {/* Security Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                {language === 'ur'
                  ? '🔒 آپ کی ادائیگی محفوظ ہے۔ رقم اسکرو میں رکھی جائے گی اور میل اسٹون کی منظوری پر جاری کی جائے گی۔'
                  : '🔒 Your payment is secure. Funds will be held in escrow and released upon milestone approval.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleClose}
                variant="outline"
                className="flex-1"
                disabled={status === 'processing'}
              >
                {translate('cancel', language)}
              </Button>
              <Button
                onClick={handlePayment}
                className="flex-1 bg-[#FF8A2B] hover:bg-[#ff7a1b] text-white"
                disabled={status === 'processing' || (!phoneNumber && paymentMethod !== 'bank')}
              >
                {status === 'processing' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {translate('processingPayment', language)}
                  </>
                ) : (
                  translate('payNow', language)
                )}
              </Button>
            </div>

            {/* API Integration Note */}
            <p className="text-xs text-gray-500 text-center">
              {language === 'ur'
                ? 'یہ ایک ڈیمو ہے۔ حقیقی انضمام کے لیے JazzCash/EasyPaisa API کی ضرورت ہے۔'
                : 'This is a demo. Real integration requires JazzCash/EasyPaisa API.'}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

PaymentModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  amount: PropTypes.number.isRequired,
  projectId: PropTypes.string.isRequired,
  projectTitle: PropTypes.string.isRequired,
  language: PropTypes.oneOf(['en', 'ur']).isRequired
};