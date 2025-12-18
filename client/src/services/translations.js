// /**
//  * Translation Service
//  * 
//  * PRODUCTION: Replace with Google Translate API for dynamic translations
//  * Current implementation uses predefined translation dictionary
//  */

// export const translations = {
//   // Navigation
//   'home': { en: 'Home', ur: 'ہوم' },
//   'browse': { en: 'Browse Companies', ur: 'کمپنیاں تلاش کریں' },
//   'postProject': { en: 'Post Project', ur: 'پروجیکٹ پوسٹ کریں' },
//   'dashboard': { en: 'Dashboard', ur: 'ڈیش بورڈ' },
//   'about': { en: 'About', ur: 'ہمارے بارے میں' },
//   'contact': { en: 'Contact', ur: 'رابطہ کریں' },
//   'signIn': { en: 'Sign In', ur: 'سائن ان' },
//   'signOut': { en: 'Sign Out', ur: 'سائن آؤٹ' },
  
//   // Home Page
//   'heroTitle': { en: 'Connect with Pakistan\'s Best Tech Companies', ur: 'پاکستان کی بہترین ٹیک کمپنیوں سے جڑیں' },
//   'heroSubtitle': { en: 'Get your web, mobile, and marketing projects done by verified professionals', ur: 'تصدیق شدہ پیشہ وروں سے ویب، موبائل اور مارکیٹنگ پروجیکٹس مکمل کروائیں' },
//   'getStarted': { en: 'Get Started', ur: 'شروع کریں' },
//   'howItWorks': { en: 'How It Works', ur: 'یہ کیسے کام کرتا ہے' },
  
//   // Categories
//   'webDevelopment': { en: 'Web Development', ur: 'ویب ڈیولپمنٹ' },
//   'mobileApps': { en: 'Mobile Apps', ur: 'موبائل ایپس' },
//   'digitalMarketing': { en: 'Digital Marketing', ur: 'ڈیجیٹل مارکیٹنگ' },
//   'uiuxDesign': { en: 'UI/UX Design', ur: 'یو آئی یو ایکس ڈیزائن' },
  
//   // Company Card
//   'verified': { en: 'Verified', ur: 'تصدیق شدہ' },
//   'reviews': { en: 'Reviews', ur: 'جائزے' },
//   'startingFrom': { en: 'Starting from', ur: 'شروع' },
//   'viewProfile': { en: 'View Profile', ur: 'پروفائل دیکھیں' },
//   'contactCompany': { en: 'Contact Company', ur: 'کمپنی سے رابطہ' },
  
//   // Project Form
//   'projectTitle': { en: 'Project Title', ur: 'پروجیکٹ کا عنوان' },
//   'projectDescription': { en: 'Project Description', ur: 'پروجیکٹ کی تفصیل' },
//   'category': { en: 'Category', ur: 'زمرہ' },
//   'budget': { en: 'Budget', ur: 'بجٹ' },
//   'deadline': { en: 'Deadline', ur: 'آخری تاریخ' },
//   'submit': { en: 'Submit', ur: 'جمع کرائیں' },
//   'cancel': { en: 'Cancel', ur: 'منسوخ کریں' },
  
//   // Dashboard
//   'myProjects': { en: 'My Projects', ur: 'میرے پروجیکٹس' },
//   'activeProjects': { en: 'Active Projects', ur: 'فعال پروجیکٹس' },
//   'completedProjects': { en: 'Completed Projects', ur: 'مکمل شدہ پروجیکٹس' },
//   'messages': { en: 'Messages', ur: 'پیغامات' },
//   'payments': { en: 'Payments', ur: 'ادائیگیاں' },
//   'settings': { en: 'Settings', ur: 'ترتیبات' },
  
//   // Payment
//   'payNow': { en: 'Pay Now', ur: 'ابھی ادا کریں' },
//   'paymentMethod': { en: 'Payment Method', ur: 'ادائیگی کا طریقہ' },
//   'jazzcash': { en: 'JazzCash', ur: 'جاز کیش' },
//   'easypaisa': { en: 'EasyPaisa', ur: 'ایزی پیسہ' },
//   'bankTransfer': { en: 'Bank Transfer', ur: 'بینک ٹرانسفر' },
//   'amount': { en: 'Amount', ur: 'رقم' },
//   'processingPayment': { en: 'Processing Payment...', ur: 'ادائیگی جاری ہے...' },
//   'paymentSuccess': { en: 'Payment Successful!', ur: 'ادائیگی کامیاب!' },
//   'paymentFailed': { en: 'Payment Failed', ur: 'ادائیگی ناکام' },
  
//   // Chatbot
//   'askQuestion': { en: 'Ask a question...', ur: 'سوال پوچھیں...' },
//   'chatWithUs': { en: 'Chat with us', ur: 'ہم سے بات کریں' },
//   'sendMessage': { en: 'Send Message', ur: 'پیغام بھیجیں' },
  
//   // Search & Filter
//   'search': { en: 'Search', ur: 'تلاش کریں' },
//   'filter': { en: 'Filter', ur: 'فلٹر' },
//   'sortBy': { en: 'Sort By', ur: 'ترتیب دیں' },
//   'rating': { en: 'Rating', ur: 'درجہ بندی' },
//   'price': { en: 'Price', ur: 'قیمت' },
//   'experience': { en: 'Experience', ur: 'تجربہ' },
  
//   // Status
//   'pending': { en: 'Pending', ur: 'زیر التواء' },
//   'active': { en: 'Active', ur: 'فعال' },
//   'completed': { en: 'Completed', ur: 'مکمل' },
//   'cancelled': { en: 'Cancelled', ur: 'منسوخ' },
  
//   // Common
//   'save': { en: 'Save', ur: 'محفوظ کریں' },
//   'edit': { en: 'Edit', ur: 'ترمیم' },
//   'delete': { en: 'Delete', ur: 'حذف کریں' },
//   'loading': { en: 'Loading...', ur: 'لوڈ ہو رہا ہے...' },
//   'error': { en: 'Error', ur: 'خرابی' },
//   'success': { en: 'Success', ur: 'کامیابی' },
//   'close': { en: 'Close', ur: 'بند کریں' },
//   'confirm': { en: 'Confirm', ur: 'تصدیق کریں' },
//   'yes': { en: 'Yes', ur: 'ہاں' },
//   'no': { en: 'No', ur: 'نہیں' },
// };

// export function translate(key, language) {
//   return translations[key]?.[language] || key;
// }

// export function translateText(text, language) {
//   // Find matching translation by English value
//   const entry = Object.entries(translations).find(
//     ([_, value]) => value.en === text
//   );
  
//   if (entry) {
//     return entry[1][language];
//   }
  
//   return text;
// }


// client/src/services/translations.js
/**
 * Enhanced Translation Service with API fallback
 * 
 * Features:
 * 1. Local dictionary for static content
 * 2. API integration for dynamic content
 * 3. Caching system for performance
 * 4. Fallback mechanisms
 */

// Main translation dictionary
export const translations = {
  // ========================
  // Navigation & Common UI
  // ========================
  'home': { en: 'Home', ur: 'ہوم' },
  'browse': { en: 'Browse Companies', ur: 'کمپنیاں تلاش کریں' },
  'postProject': { en: 'Post Project', ur: 'پروجیکٹ پوسٹ کریں' },
  'dashboard': { en: 'Dashboard', ur: 'ڈیش بورڈ' },
  'about': { en: 'About', ur: 'ہمارے بارے میں' },
  'contact': { en: 'Contact', ur: 'رابطہ کریں' },
  'signIn': { en: 'Sign In', ur: 'سائن ان' },
  'signOut': { en: 'Sign Out', ur: 'سائن آؤٹ' },
  'adminPanel': { en: 'Admin Panel', ur: 'ایڈمن پینل' },
  'adminLogin': { en: 'Admin Login', ur: 'ایڈمن لاگ ان' },
  'adminSignOut': { en: 'Admin Sign Out', ur: 'ایڈمن سائن آؤٹ' },
  
  // ========================
  // Home Page
  // ========================
  'heroTitle': { en: 'Connect with Pakistan\'s Best Tech Companies', ur: 'پاکستان کی بہترین ٹیک کمپنیوں سے جڑیں' },
  'heroSubtitle': { en: 'Get your web, mobile, and marketing projects done by verified professionals', ur: 'تصدیق شدہ پیشہ وروں سے ویب، موبائل اور مارکیٹنگ پروجیکٹس مکمل کروائیں' },
  'getStarted': { en: 'Get Started', ur: 'شروع کریں' },
  'howItWorks': { en: 'How It Works', ur: 'یہ کیسے کام کرتا ہے' },
  'featuredCompanies': { en: 'Featured Companies', ur: 'نمایاں کمپنیاں' },
  'testimonials': { en: 'Testimonials', ur: 'شہادت نامے' },
  'trustedBy': { en: 'Trusted by Pakistani Businesses', ur: 'پاکستانی کاروباروں کی جانب سے قابل اعتماد' },
  
  // ========================
  // Categories & Services
  // ========================
  'webDevelopment': { en: 'Web Development', ur: 'ویب ڈیولپمنٹ' },
  'mobileApps': { en: 'Mobile Apps', ur: 'موبائل ایپس' },
  'digitalMarketing': { en: 'Digital Marketing', ur: 'ڈیجیٹل مارکیٹنگ' },
  'uiuxDesign': { en: 'UI/UX Design', ur: 'یو آئی یو ایکس ڈیزائن' },
  'ecommerce': { en: 'E-commerce', ur: 'ای کامرس' },
  'seo': { en: 'SEO Services', ur: 'ایس ای او خدمات' },
  'contentMarketing': { en: 'Content Marketing', ur: 'کنٹینٹ مارکیٹنگ' },
  'socialMedia': { en: 'Social Media Marketing', ur: 'سوشل میڈیا مارکیٹنگ' },
  'softwareDevelopment': { en: 'Software Development', ur: 'سافٹ ویئر ڈیولپمنٹ' },
  'cybersecurity': { en: 'Cybersecurity', ur: 'سائبر سیکورٹی' },
  'cloudServices': { en: 'Cloud Services', ur: 'کلاؤڈ خدمات' },
  'itConsulting': { en: 'IT Consulting', ur: 'آئی ٹی مشاورت' },
  
  // ========================
  // Company Related
  // ========================
  'verified': { en: 'Verified', ur: 'تصدیق شدہ' },
  'reviews': { en: 'Reviews', ur: 'جائزے' },
  'rating': { en: 'Rating', ur: 'درجہ بندی' },
  'startingFrom': { en: 'Starting from', ur: 'شروع' },
  'viewProfile': { en: 'View Profile', ur: 'پروفائل دیکھیں' },
  'contactCompany': { en: 'Contact Company', ur: 'کمپنی سے رابطہ' },
  'inviteToBid': { en: 'Invite to Bid', ur: 'بڈ کے لیے مدعو کریں' },
  'companyProfile': { en: 'Company Profile', ur: 'کمپنی پروفائل' },
  'portfolio': { en: 'Portfolio', ur: 'پورٹ فولیو' },
  'teamMembers': { en: 'Team Members', ur: 'ٹیم کے اراکین' },
  'yearsExperience': { en: 'Years Experience', ur: 'سالوں کا تجربہ' },
  'projectsCompleted': { en: 'Projects Completed', ur: 'مکمل شدہ پروجیکٹس' },
  'clientsServed': { en: 'Clients Served', ur: 'خدمت کرنے والے کلائنٹس' },
  'successRate': { en: 'Success Rate', ur: 'کامیابی کی شرح' },
  
  // ========================
  // Project Related
  // ========================
  'projectTitle': { en: 'Project Title', ur: 'پروجیکٹ کا عنوان' },
  'projectDescription': { en: 'Project Description', ur: 'پروجیکٹ کی تفصیل' },
  'category': { en: 'Category', ur: 'زمرہ' },
  'budget': { en: 'Budget', ur: 'بجٹ' },
  'deadline': { en: 'Deadline', ur: 'آخری تاریخ' },
  'timeline': { en: 'Timeline', ur: 'ٹائم لائن' },
  'techStack': { en: 'Tech Stack', ur: 'ٹیک اسٹیک' },
  'milestones': { en: 'Milestones', ur: 'مائلی اسٹونز' },
  'requirements': { en: 'Requirements', ur: 'ضروریات' },
  'deliverables': { en: 'Deliverables', ur: 'ڈیلیوریبلز' },
  'submit': { en: 'Submit', ur: 'جمع کرائیں' },
  'cancel': { en: 'Cancel', ur: 'منسوخ کریں' },
  'saveDraft': { en: 'Save Draft', ur: 'ڈرافٹ محفوظ کریں' },
  'postProject': { en: 'Post Project', ur: 'پروجیکٹ پوسٹ کریں' },
  'editProject': { en: 'Edit Project', ur: 'پروجیکٹ میں ترمیم کریں' },
  'deleteProject': { en: 'Delete Project', ur: 'پروجیکٹ حذف کریں' },
  'projectStatus': { en: 'Project Status', ur: 'پروجیکٹ کی حیثیت' },
  'activeProjects': { en: 'Active Projects', ur: 'فعال پروجیکٹس' },
  'completedProjects': { en: 'Completed Projects', ur: 'مکمل شدہ پروجیکٹس' },
  'pendingProjects': { en: 'Pending Projects', ur: 'زیر التواء پروجیکٹس' },
  'cancelledProjects': { en: 'Cancelled Projects', ur: 'منسوخ شدہ پروجیکٹس' },
  
  // ========================
  // Bidding System
  // ========================
  'placeBid': { en: 'Place Bid', ur: 'بڈ لگائیں' },
  'yourBid': { en: 'Your Bid', ur: 'آپ کی بڈ' },
  'bidAmount': { en: 'Bid Amount', ur: 'بڈ کی رقم' },
  'deliveryTime': { en: 'Delivery Time', ur: 'ڈلیوری کا وقت' },
  'proposal': { en: 'Proposal', ur: 'تجویز' },
  'bidsReceived': { en: 'Bids Received', ur: 'موصولہ بڈز' },
  'acceptBid': { en: 'Accept Bid', ur: 'بڈ قبول کریں' },
  'rejectBid': { en: 'Reject Bid', ur: 'بڈ مسترد کریں' },
  'negotiate': { en: 'Negotiate', ur: 'مذاکرات کریں' },
  'bidHistory': { en: 'Bid History', ur: 'بڈ کی تاریخ' },
  'winningBid': { en: 'Winning Bid', ur: 'جیتنے والی بڈ' },
  
  // ========================
  // Dashboard
  // ========================
  'myProjects': { en: 'My Projects', ur: 'میرے پروجیکٹس' },
  'myBids': { en: 'My Bids', ur: 'میری بڈز' },
  'messages': { en: 'Messages', ur: 'پیغامات' },
  'payments': { en: 'Payments', ur: 'ادائیگیاں' },
  'settings': { en: 'Settings', ur: 'ترتیبات' },
  'notifications': { en: 'Notifications', ur: 'اطلاعات' },
  'recentActivity': { en: 'Recent Activity', ur: 'حالیہ سرگرمیاں' },
  'quickStats': { en: 'Quick Stats', ur: 'فوری اعداد و شمار' },
  'profileCompletion': { en: 'Profile Completion', ur: 'پروفائل کی تکمیل' },
  'accountSettings': { en: 'Account Settings', ur: 'اکاؤنٹ کی ترتیبات' },
  'securitySettings': { en: 'Security Settings', ur: 'سیکیورٹی ترتیبات' },
  'notificationSettings': { en: 'Notification Settings', ur: 'اطلاعات کی ترتیبات' },
  
  // ========================
  // Payment & Transactions
  // ========================
  'payNow': { en: 'Pay Now', ur: 'ابھی ادا کریں' },
  'paymentMethod': { en: 'Payment Method', ur: 'ادائیگی کا طریقہ' },
  'jazzcash': { en: 'JazzCash', ur: 'جاز کیش' },
  'easypaisa': { en: 'EasyPaisa', ur: 'ایزی پیسہ' },
  'bankTransfer': { en: 'Bank Transfer', ur: 'بینک ٹرانسفر' },
  'amount': { en: 'Amount', ur: 'رقم' },
  'processingPayment': { en: 'Processing Payment...', ur: 'ادائیگی جاری ہے...' },
  'paymentSuccess': { en: 'Payment Successful!', ur: 'ادائیگی کامیاب!' },
  'paymentFailed': { en: 'Payment Failed', ur: 'ادائیگی ناکام' },
  'transactionId': { en: 'Transaction ID', ur: 'ٹرانزیکشن آئی ڈی' },
  'paymentDate': { en: 'Payment Date', ur: 'ادائیگی کی تاریخ' },
  'paymentStatus': { en: 'Payment Status', ur: 'ادائیگی کی حیثیت' },
  'refund': { en: 'Refund', ur: 'واپسی' },
  'escrow': { en: 'Escrow', ur: 'اسکرو' },
  'releaseFunds': { en: 'Release Funds', ur: 'فنڈز جاری کریں' },
  'dispute': { en: 'Dispute', ur: 'تنازعہ' },
  
  // ========================
  // Messaging & Communication
  // ========================
  'chat': { en: 'Chat', ur: 'چیٹ' },
  'messages': { en: 'Messages', ur: 'پیغامات' },
  'conversations': { en: 'Conversations', ur: 'بات چیت' },
  'sendMessage': { en: 'Send Message', ur: 'پیغام بھیجیں' },
  'typeMessage': { en: 'Type a message...', ur: 'پیغام ٹائپ کریں...' },
  'attachFile': { en: 'Attach File', ur: 'فائل منسلک کریں' },
  'online': { en: 'Online', ur: 'آن لائن' },
  'offline': { en: 'Offline', ur: 'آف لائن' },
  'lastSeen': { en: 'Last seen', ur: 'آخری بار دیکھا گیا' },
  'unreadMessages': { en: 'Unread Messages', ur: 'غیر پڑھے پیغامات' },
  'markAsRead': { en: 'Mark as Read', ur: 'پڑھا ہوا نشان زد کریں' },
  'deleteConversation': { en: 'Delete Conversation', ur: 'بات چیت حذف کریں' },
  'blockUser': { en: 'Block User', ur: 'صارف کو بلاک کریں' },
  'reportUser': { en: 'Report User', ur: 'صارف کی رپورٹ کریں' },
  
  // ========================
  // Search & Filter
  // ========================
  'search': { en: 'Search', ur: 'تلاش کریں' },
  'filter': { en: 'Filter', ur: 'فلٹر' },
  'sortBy': { en: 'Sort By', ur: 'ترتیب دیں' },
  'priceRange': { en: 'Price Range', ur: 'قیمت کی حد' },
  'experience': { en: 'Experience', ur: 'تجربہ' },
  'location': { en: 'Location', ur: 'مقام' },
  'skills': { en: 'Skills', ur: 'مہارتیں' },
  'services': { en: 'Services', ur: 'خدمات' },
  'clearFilters': { en: 'Clear Filters', ur: 'فلٹرز صاف کریں' },
  'applyFilters': { en: 'Apply Filters', ur: 'فلٹرز لاگو کریں' },
  'searchResults': { en: 'Search Results', ur: 'تلاش کے نتائج' },
  'noResultsFound': { en: 'No Results Found', ur: 'کوئی نتیجہ نہیں ملا' },
  'refineSearch': { en: 'Refine Search', ur: 'تلاش کو بہتر بنائیں' },
  
  // ========================
  // Status & Actions
  // ========================
  'pending': { en: 'Pending', ur: 'زیر التواء' },
  'active': { en: 'Active', ur: 'فعال' },
  'completed': { en: 'Completed', ur: 'مکمل' },
  'cancelled': { en: 'Cancelled', ur: 'منسوخ' },
  'inProgress': { en: 'In Progress', ur: 'جاری ہے' },
  'onHold': { en: 'On Hold', ur: 'روکا ہوا' },
  'underReview': { en: 'Under Review', ur: 'جائزہ کے تحت' },
  'approved': { en: 'Approved', ur: 'منظور شدہ' },
  'rejected': { en: 'Rejected', ur: 'مسترد شدہ' },
  'verified': { en: 'Verified', ur: 'تصدیق شدہ' },
  'unverified': { en: 'Unverified', ur: 'غیر تصدیق شدہ' },
  
  // ========================
  // Common Actions
  // ========================
  'save': { en: 'Save', ur: 'محفوظ کریں' },
  'edit': { en: 'Edit', ur: 'ترمیم' },
  'delete': { en: 'Delete', ur: 'حذف کریں' },
  'update': { en: 'Update', ur: 'اپ ڈیٹ' },
  'create': { en: 'Create', ur: 'بنائیں' },
  'view': { en: 'View', ur: 'دیکھیں' },
  'download': { en: 'Download', ur: 'ڈاؤن لوڈ' },
  'upload': { en: 'Upload', ur: 'اپ لوڈ' },
  'share': { en: 'Share', ur: 'اشتراک کریں' },
  'print': { en: 'Print', ur: 'پرنٹ کریں' },
  'export': { en: 'Export', ur: 'ایکسپورٹ' },
  'import': { en: 'Import', ur: 'امپورٹ' },
  'refresh': { en: 'Refresh', ur: 'ریفریش' },
  'back': { en: 'Back', ur: 'واپس' },
  'next': { en: 'Next', ur: 'اگلا' },
  'previous': { en: 'Previous', ur: 'پچھلا' },
  'finish': { en: 'Finish', ur: 'ختم کریں' },
  'continue': { en: 'Continue', ur: 'جاری رکھیں' },
  'skip': { en: 'Skip', ur: 'چھوڑیں' },
  'cancel': { en: 'Cancel', ur: 'منسوخ کریں' },
  'confirm': { en: 'Confirm', ur: 'تصدیق کریں' },
  'yes': { en: 'Yes', ur: 'ہاں' },
  'no': { en: 'No', ur: 'نہیں' },
  'ok': { en: 'OK', ur: 'ٹھیک ہے' },
  
  // ========================
  // System & UI States
  // ========================
  'loading': { en: 'Loading...', ur: 'لوڈ ہو رہا ہے...' },
  'saving': { en: 'Saving...', ur: 'محفوظ ہو رہا ہے...' },
  'processing': { en: 'Processing...', ur: 'پروسیسنگ...' },
  'error': { en: 'Error', ur: 'خرابی' },
  'success': { en: 'Success', ur: 'کامیابی' },
  'warning': { en: 'Warning', ur: 'انتباہ' },
  'info': { en: 'Info', ur: 'معلومات' },
  'close': { en: 'Close', ur: 'بند کریں' },
  'open': { en: 'Open', ur: 'کھولیں' },
  'hide': { en: 'Hide', ur: 'چھپائیں' },
  'show': { en: 'Show', ur: 'دکھائیں' },
  'expand': { en: 'Expand', ur: 'پھیلائیں' },
  'collapse': { en: 'Collapse', ur: 'سمیٹیں' },
  'minimize': { en: 'Minimize', ur: 'کم سے کم کریں' },
  'maximize': { en: 'Maximize', ur: 'زیادہ سے زیادہ کریں' },
  
  // ========================
  // Forms & Validation
  // ========================
  'required': { en: 'Required', ur: 'ضروری' },
  'optional': { en: 'Optional', ur: 'اختیاری' },
  'invalid': { en: 'Invalid', ur: 'غلط' },
  'valid': { en: 'Valid', ur: 'درست' },
  'email': { en: 'Email', ur: 'ای میل' },
  'password': { en: 'Password', ur: 'پاس ورڈ' },
  'confirmPassword': { en: 'Confirm Password', ur: 'پاس ورڈ کی تصدیق کریں' },
  'phoneNumber': { en: 'Phone Number', ur: 'فون نمبر' },
  'fullName': { en: 'Full Name', ur: 'پورا نام' },
  'companyName': { en: 'Company Name', ur: 'کمپنی کا نام' },
  'address': { en: 'Address', ur: 'پتہ' },
  'city': { en: 'City', ur: 'شہر' },
  'country': { en: 'Country', ur: 'ملک' },
  'zipCode': { en: 'ZIP Code', ur: 'زیپ کوڈ' },
  'website': { en: 'Website', ur: 'ویب سائٹ' },
  'description': { en: 'Description', ur: 'تفصیل' },
  'termsConditions': { en: 'Terms & Conditions', ur: 'شرائط و ضوابط' },
  'privacyPolicy': { en: 'Privacy Policy', ur: 'رازداری کی پالیسی' },
  'agreeTerms': { en: 'I agree to the Terms & Conditions', ur: 'میں شرائط و ضوابط سے اتفاق کرتا ہوں' },
  
  // ========================
  // Admin Panel
  // ========================
  'adminDashboard': { en: 'Admin Dashboard', ur: 'ایڈمن ڈیش بورڈ' },
  'verificationDashboard': { en: 'Verification Dashboard', ur: 'تصدیق ڈیش بورڈ' },
  'pendingVerifications': { en: 'Pending Verifications', ur: 'زیر التواء تصدیقات' },
  'approvedCompanies': { en: 'Approved Companies', ur: 'منظور شدہ کمپنیاں' },
  'rejectedCompanies': { en: 'Rejected Companies', ur: 'مسترد شدہ کمپنیاں' },
  'viewDocuments': { en: 'View Documents', ur: 'دستاویزات دیکھیں' },
  'approve': { en: 'Approve', ur: 'منظور کریں' },
  'reject': { en: 'Reject', ur: 'مسترد کریں' },
  'requestMoreInfo': { en: 'Request More Info', ur: 'مزید معلومات کی درخواست کریں' },
  'adminComments': { en: 'Admin Comments', ur: 'ایڈمن کے تبصرے' },
  'verificationStatus': { en: 'Verification Status', ur: 'تصدیق کی حیثیت' },
  'userManagement': { en: 'User Management', ur: 'صارف کا انتظام' },
  'contentModeration': { en: 'Content Moderation', ur: 'مواد کی نگرانی' },
  'systemSettings': { en: 'System Settings', ur: 'سسٹم کی ترتیبات' },
  'reports': { en: 'Reports', ur: 'رپورٹس' },
  'analytics': { en: 'Analytics', ur: 'تجزیات' },
  
  // ========================
  // Time & Dates
  // ========================
  'today': { en: 'Today', ur: 'آج' },
  'yesterday': { en: 'Yesterday', ur: 'کل' },
  'tomorrow': { en: 'Tomorrow', ur: 'کل' },
  'thisWeek': { en: 'This Week', ur: 'اس ہفتے' },
  'thisMonth': { en: 'This Month', ur: 'اس ماہ' },
  'thisYear': { en: 'This Year', ur: 'اس سال' },
  'lastWeek': { en: 'Last Week', ur: 'پچھلے ہفتے' },
  'lastMonth': { en: 'Last Month', ur: 'پچھلے ماہ' },
  'lastYear': { en: 'Last Year', ur: 'پچھلے سال' },
  'nextWeek': { en: 'Next Week', ur: 'اگلے ہفتے' },
  'nextMonth': { en: 'Next Month', ur: 'اگلے ماہ' },
  'nextYear': { en: 'Next Year', ur: 'اگلے سال' },
  'days': { en: 'Days', ur: 'دن' },
  'weeks': { en: 'Weeks', ur: 'ہفتے' },
  'months': { en: 'Months', ur: 'مہینے' },
  'years': { en: 'Years', ur: 'سال' },
  
  // ========================
  // Numbers & Quantities
  // ========================
  'one': { en: 'One', ur: 'ایک' },
  'two': { en: 'Two', ur: 'دو' },
  'three': { en: 'Three', ur: 'تین' },
  'four': { en: 'Four', ur: 'چار' },
  'five': { en: 'Five', ur: 'پانچ' },
  'six': { en: 'Six', ur: 'چھ' },
  'seven': { en: 'Seven', ur: 'سات' },
  'eight': { en: 'Eight', ur: 'آٹھ' },
  'nine': { en: 'Nine', ur: 'نو' },
  'ten': { en: 'Ten', ur: 'دس' },
  'dozen': { en: 'Dozen', ur: 'درجن' },
  'hundred': { en: 'Hundred', ur: 'سو' },
  'thousand': { en: 'Thousand', ur: 'ہزار' },
  'million': { en: 'Million', ur: 'ملین' },
  'billion': { en: 'Billion', ur: 'بلین' },
  
  // ========================
  // Currency & Money
  // ========================
  'pkr': { en: 'PKR', ur: 'روپے' },
  'usd': { en: 'USD', ur: 'ڈالر' },
  'eur': { en: 'EUR', ur: 'یورو' },
  'gbp': { en: 'GBP', ur: 'پاؤنڈ' },
  'currency': { en: 'Currency', ur: 'کرنسی' },
  'exchangeRate': { en: 'Exchange Rate', ur: 'ایکسچینج ریٹ' },
  'conversion': { en: 'Conversion', ur: 'تبادلہ' },
  
  // ========================
  // Help & Support
  // ========================
  'help': { en: 'Help', ur: 'مدد' },
  'support': { en: 'Support', ur: 'سپورٹ' },
  'faq': { en: 'FAQ', ur: 'عمومی سوالات' },
  'contactUs': { en: 'Contact Us', ur: 'ہم سے رابطہ کریں' },
  'customerService': { en: 'Customer Service', ur: 'کسٹمر سروس' },
  'technicalSupport': { en: 'Technical Support', ur: 'ٹیکنیکل سپورٹ' },
  'feedback': { en: 'Feedback', ur: 'فیڈ بیک' },
  'suggestions': { en: 'Suggestions', ur: 'تجاویز' },
  'reportIssue': { en: 'Report Issue', ur: 'مسئلہ رپورٹ کریں' },
  'bugReport': { en: 'Bug Report', ur: 'بگ رپورٹ' },
  'featureRequest': { en: 'Feature Request', ur: 'فیچر کی درخواست' },
};

// Helper functions for backward compatibility
export function translate(key, language) {
  return translations[key]?.[language] || key;
}

export function translateText(text, language) {
  // Find matching translation by English value
  const entry = Object.entries(translations).find(
    ([_, value]) => value.en === text
  );
  
  if (entry) {
    return entry[1][language];
  }
  
  return text;
}

// Export for use with new TranslationService
export default translations;