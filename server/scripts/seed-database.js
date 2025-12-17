// ==========================================
// TechConnect - Updated MongoDB Seed Script
// Aligned with frontend component requirements
// ==========================================

// Switch to your database
// use techconnect

// Clear existing data
db.users.deleteMany({});
db.companies.deleteMany({});
db.projects.deleteMany({});
db.reviews.deleteMany({});
db.bids.deleteMany({});

print("✅ Cleared existing data");

// ==========================================
// 1. CREATE USERS (10 Clients + 20 Companies + 1 Admin)
// ==========================================
const hashedPassword = "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi"; // password

// Get ObjectIds for reference
const userIds = Array.from({length: 31}, () => ObjectId());

const users = [
  // Clients (10)
  { _id: userIds[0], email: "ahmed.khan@gmail.com", password: hashedPassword, name: "Ahmed Khan", type: "client", verified: true, phone: "+92-300-1234567", createdAt: new Date() },
  { _id: userIds[1], email: "fatima.malik@yahoo.com", password: hashedPassword, name: "Fatima Malik", type: "client", verified: true, phone: "+92-321-2345678", createdAt: new Date() },
  { _id: userIds[2], email: "usman.raza@hotmail.com", password: hashedPassword, name: "Usman Raza", type: "client", verified: true, phone: "+92-333-3456789", createdAt: new Date() },
  { _id: userIds[3], email: "ayesha.siddiqui@gmail.com", password: hashedPassword, name: "Ayesha Siddiqui", type: "client", verified: true, phone: "+92-345-4567890", createdAt: new Date() },
  { _id: userIds[4], email: "bilal.ahmed@outlook.com", password: hashedPassword, name: "Bilal Ahmed", type: "client", verified: true, phone: "+92-301-5678901", createdAt: new Date() },
  { _id: userIds[5], email: "sana.hassan@gmail.com", password: hashedPassword, name: "Sana Hassan", type: "client", verified: true, phone: "+92-322-6789012", createdAt: new Date() },
  { _id: userIds[6], email: "imran.shah@yahoo.com", password: hashedPassword, name: "Imran Shah", type: "client", verified: true, phone: "+92-334-7890123", createdAt: new Date() },
  { _id: userIds[7], email: "zainab.ali@gmail.com", password: hashedPassword, name: "Zainab Ali", type: "client", verified: true, phone: "+92-346-8901234", createdAt: new Date() },
  { _id: userIds[8], email: "hamza.iqbal@hotmail.com", password: hashedPassword, name: "Hamza Iqbal", type: "client", verified: true, phone: "+92-302-9012345", createdAt: new Date() },
  { _id: userIds[9], email: "maria.khan@gmail.com", password: hashedPassword, name: "Maria Khan", type: "client", verified: true, phone: "+92-323-0123456", createdAt: new Date() },

  // Companies (20) - Note: userIds[10] to [29]
  { _id: userIds[10], email: "info@digitaldynamics.com", password: hashedPassword, name: "Digital Dynamics", type: "company", verified: true, phone: "+92-21-1111111", companyId: "comp001", createdAt: new Date() },
  { _id: userIds[11], email: "info@mobilemasters.com", password: hashedPassword, name: "Mobile Masters", type: "company", verified: true, phone: "+92-42-2222222", companyId: "comp002", createdAt: new Date() },
  { _id: userIds[12], email: "info@marketingmavens.com", password: hashedPassword, name: "Marketing Mavens", type: "company", verified: true, phone: "+92-51-3333333", companyId: "comp003", createdAt: new Date() },
  { _id: userIds[13], email: "info@techinnovators.com", password: hashedPassword, name: "Tech Innovators", type: "company", verified: true, phone: "+92-21-4444444", companyId: "comp004", createdAt: new Date() },
  { _id: userIds[14], email: "info@creativecoders.com", password: hashedPassword, name: "Creative Coders", type: "company", verified: true, phone: "+92-42-5555555", companyId: "comp005", createdAt: new Date() },
  { _id: userIds[15], email: "info@apparchitects.com", password: hashedPassword, name: "App Architects", type: "company", verified: true, phone: "+92-51-6666666", companyId: "comp006", createdAt: new Date() },
  { _id: userIds[16], email: "info@growthgurus.com", password: hashedPassword, name: "Growth Gurus", type: "company", verified: true, phone: "+92-21-7777777", companyId: "comp007", createdAt: new Date() },
  { _id: userIds[17], email: "info@cloudcrafters.com", password: hashedPassword, name: "Cloud Crafters", type: "company", verified: false, phone: "+92-42-8888888", companyId: "comp008", createdAt: new Date() },
  { _id: userIds[18], email: "info@premiumsolutions.com", password: hashedPassword, name: "Premium Solutions", type: "company", verified: true, phone: "+92-51-9999999", companyId: "comp009", createdAt: new Date() },
  { _id: userIds[19], email: "info@budgetdevelopers.com", password: hashedPassword, name: "Budget Developers", type: "company", verified: true, phone: "+92-21-0000000", companyId: "comp010", createdAt: new Date() },
  
  // Additional companies for BrowsePage.jsx
  { _id: userIds[20], email: "info@webwizards.com", password: hashedPassword, name: "Web Wizards", type: "company", verified: true, phone: "+92-42-1111112", companyId: "comp011", createdAt: new Date() },
  { _id: userIds[21], email: "info@appbuilders.com", password: hashedPassword, name: "App Builders", type: "company", verified: true, phone: "+92-51-2222223", companyId: "comp012", createdAt: new Date() },
  { _id: userIds[22], email: "info@marketingpros.com", password: hashedPassword, name: "Marketing Pros", type: "company", verified: true, phone: "+92-21-3333334", companyId: "comp013", createdAt: new Date() },
  { _id: userIds[23], email: "info@techgiants.com", password: hashedPassword, name: "Tech Giants", type: "company", verified: true, phone: "+92-42-4444445", companyId: "comp014", createdAt: new Date() },
  { _id: userIds[24], email: "info@codecrafters.com", password: hashedPassword, name: "Code Crafters", type: "company", verified: true, phone: "+92-51-5555556", companyId: "comp015", createdAt: new Date() },
  { _id: userIds[25], email: "info@digitalninjas.com", password: hashedPassword, name: "Digital Ninjas", type: "company", verified: true, phone: "+92-21-6666667", companyId: "comp016", createdAt: new Date() },
  { _id: userIds[26], email: "info@webmasters.com", password: hashedPassword, name: "Web Masters", type: "company", verified: true, phone: "+92-42-7777778", companyId: "comp017", createdAt: new Date() },
  { _id: userIds[27], email: "info@mobileexperts.com", password: hashedPassword, name: "Mobile Experts", type: "company", verified: true, phone: "+92-51-8888889", companyId: "comp018", createdAt: new Date() },
  { _id: userIds[28], email: "info@seospecialists.com", password: hashedPassword, name: "SEO Specialists", type: "company", verified: true, phone: "+92-21-9999990", companyId: "comp019", createdAt: new Date() },
  { _id: userIds[29], email: "info@fullstackdevs.com", password: hashedPassword, name: "Full Stack Devs", type: "company", verified: true, phone: "+92-42-0000001", companyId: "comp020", createdAt: new Date() },

  // Admin
  { _id: userIds[30], email: "admin@techconnect.pk", password: hashedPassword, name: "TechConnect Admin", type: "admin", verified: true, phone: "+92-300-0000001", createdAt: new Date() }
];

db.users.insertMany(users);
print("✅ Inserted 31 users (10 clients, 20 companies, 1 admin)");

// ==========================================
// 2. CREATE COMPANY PROFILES (Align with BrowsePage.jsx)
// ==========================================
const companyProfiles = [
  // From BrowsePage.jsx companies array
  {
    _id: ObjectId(),
    name: "Digital Dynamics",
    userId: userIds[10],
    description: "Full-stack development experts",
    services: ["Web Development", "UI/UX Design", "Cloud Solutions"],
    location: "Karachi, Pakistan",
    teamSize: "50+",
    yearsInBusiness: 8,
    ratings: { average: 4.8, count: 24, reviews: [] },
    verified: true,
    verificationStatus: "approved",
    startingPrice: 150000,
    category: "web",
    tagline: "Full-stack development experts",
    portfolio: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: ObjectId(),
    name: "Mobile Masters",
    userId: userIds[11],
    description: "Native & hybrid app specialists",
    services: ["Mobile Development", "React Native", "iOS/Android"],
    location: "Lahore, Pakistan",
    teamSize: "40+",
    yearsInBusiness: 6,
    ratings: { average: 4.9, count: 31, reviews: [] },
    verified: true,
    verificationStatus: "approved",
    startingPrice: 250000,
    category: "mobile",
    tagline: "Native & hybrid app specialists",
    portfolio: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: ObjectId(),
    name: "Marketing Mavens",
    userId: userIds[12],
    description: "ROI-focused digital marketing",
    services: ["SEO", "Social Media", "PPC", "Content Marketing"],
    location: "Islamabad, Pakistan",
    teamSize: "30+",
    yearsInBusiness: 5,
    ratings: { average: 4.7, count: 19, reviews: [] },
    verified: true,
    verificationStatus: "approved",
    startingPrice: 80000,
    category: "marketing",
    tagline: "ROI-focused digital marketing",
    portfolio: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: ObjectId(),
    name: "Tech Innovators",
    userId: userIds[13],
    description: "Enterprise software solutions",
    services: ["Web Development", "Mobile Apps", "Consulting", "AI/ML"],
    location: "Karachi, Pakistan",
    teamSize: "100+",
    yearsInBusiness: 12,
    ratings: { average: 4.9, count: 28, reviews: [] },
    verified: true,
    verificationStatus: "approved",
    startingPrice: 350000,
    category: "web",
    tagline: "Enterprise software solutions",
    portfolio: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: ObjectId(),
    name: "Creative Coders",
    userId: userIds[14],
    description: "Beautiful, functional websites",
    services: ["Web Design", "Frontend", "WordPress", "E-commerce"],
    location: "Lahore, Pakistan",
    teamSize: "25+",
    yearsInBusiness: 4,
    ratings: { average: 4.6, count: 16, reviews: [] },
    verified: true,
    verificationStatus: "approved",
    startingPrice: 100000,
    category: "web",
    tagline: "Beautiful, functional websites",
    portfolio: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: ObjectId(),
    name: "App Architects",
    userId: userIds[15],
    description: "Scalable mobile solutions",
    services: ["iOS", "Android", "Flutter", "React Native"],
    location: "Islamabad, Pakistan",
    teamSize: "35+",
    yearsInBusiness: 7,
    ratings: { average: 4.8, count: 22, reviews: [] },
    verified: true,
    verificationStatus: "approved",
    startingPrice: 200000,
    category: "mobile",
    tagline: "Scalable mobile solutions",
    portfolio: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: ObjectId(),
    name: "Growth Gurus",
    userId: userIds[16],
    description: "Data-driven marketing strategies",
    services: ["Analytics", "Content", "Email Marketing", "Social Media"],
    location: "Karachi, Pakistan",
    teamSize: "20+",
    yearsInBusiness: 5,
    ratings: { average: 4.7, count: 20, reviews: [] },
    verified: true,
    verificationStatus: "approved",
    startingPrice: 90000,
    category: "marketing",
    tagline: "Data-driven marketing strategies",
    portfolio: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: ObjectId(),
    name: "Cloud Crafters",
    userId: userIds[17],
    description: "Cloud infrastructure experts",
    services: ["AWS", "DevOps", "Backend", "Microservices"],
    location: "Lahore, Pakistan",
    teamSize: "15+",
    yearsInBusiness: 3,
    ratings: { average: 4.5, count: 12, reviews: [] },
    verified: false,
    verificationStatus: "pending",
    startingPrice: 180000,
    category: "web",
    tagline: "Cloud infrastructure experts",
    portfolio: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: ObjectId(),
    name: "Premium Solutions",
    userId: userIds[18],
    description: "Enterprise-grade development",
    services: ["Web Dev", "Mobile", "AI/ML", "Blockchain"],
    location: "Islamabad, Pakistan",
    teamSize: "80+",
    yearsInBusiness: 10,
    ratings: { average: 4.9, count: 35, reviews: [] },
    verified: true,
    verificationStatus: "approved",
    startingPrice: 500000,
    category: "web",
    tagline: "Enterprise-grade development",
    portfolio: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: ObjectId(),
    name: "Budget Developers",
    userId: userIds[19],
    description: "Affordable quality solutions",
    services: ["WordPress", "Basic Web", "SEO", "Maintenance"],
    location: "Karachi, Pakistan",
    teamSize: "10+",
    yearsInBusiness: 2,
    ratings: { average: 4.4, count: 18, reviews: [] },
    verified: true,
    verificationStatus: "approved",
    startingPrice: 50000,
    category: "web",
    tagline: "Affordable quality solutions",
    portfolio: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Add more companies for BrowsePage.jsx
for (let i = 20; i <= 29; i++) {
  const categories = ["web", "mobile", "marketing"];
  const category = categories[i % 3];
  const basePrice = [150000, 250000, 80000][i % 3];
  
  companyProfiles.push({
    _id: ObjectId(),
    name: users[i].name,
    userId: userIds[i],
    description: `Professional ${category === "web" ? "web development" : category === "mobile" ? "mobile app development" : "digital marketing"} services`,
    services: category === "web" ? ["Web Development", "UI/UX", "E-commerce"] : 
              category === "mobile" ? ["iOS", "Android", "Cross-platform"] : 
              ["SEO", "Social Media", "Content Marketing"],
    location: i % 3 === 0 ? "Karachi, Pakistan" : i % 3 === 1 ? "Lahore, Pakistan" : "Islamabad, Pakistan",
    teamSize: `${20 + (i * 3)}`,
    yearsInBusiness: 3 + (i % 5),
    ratings: { average: 4.5 + (i * 0.05), count: 15 + i, reviews: [] },
    verified: true,
    verificationStatus: "approved",
    startingPrice: basePrice + (i * 10000),
    category: category,
    tagline: `Expert ${category} services`,
    portfolio: [],
    createdAt: new Date(),
    updatedAt: new Date()
  });
}

db.companies.insertMany(companyProfiles);
print("✅ Inserted 20 company profiles");

// Update user documents with companyId references
companyProfiles.forEach((company, index) => {
  db.users.updateOne(
    { _id: company.userId },
    { $set: { companyId: company._id } }
  );
});

// ==========================================
// 3. CREATE PROJECTS (Align with BrowseProjectsPage.jsx and DashboardPage.jsx)
// ==========================================
const projectIds = Array.from({length: 30}, () => ObjectId());
const now = new Date();

const projects = [
  // From DashboardPage.jsx projects array
  {
    _id: projectIds[0],
    title: "E-commerce Website Development",
    description: "I need a fully functional e-commerce website with the following features: Product catalog with search and filtering, user registration and login system, shopping cart and checkout process, payment gateway integration (JazzCash/EasyPaisa), admin dashboard for product management, order tracking system, mobile responsive design. Expected traffic: 1000+ daily visitors. Target audience: Pakistani consumers aged 18-45. Please include hosting recommendations and maintenance plans in your proposal.",
    category: "web",
    budget: { min: 150000, max: 250000, range: "150,000 - 250,000" },
    timeline: { value: "2-3", unit: "months" },
    clientId: userIds[0],
    clientInfo: { name: "Ahmed Khan", email: "ahmed.khan@gmail.com", phone: "+92-300-1234567" },
    techStack: ["React", "Node.js", "MongoDB"],
    attachments: [],
    isInviteOnly: false,
    invitedCompanies: [],
    status: "posted",
    bids: [],
    paymentMethod: "jazzcash",
    milestones: [],
    viewCount: 124,
    createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000)
  },
  {
    _id: projectIds[1],
    title: "Mobile App for Delivery Service",
    description: "I need a cross-platform mobile app (iOS & Android) with these features: User app for browsing restaurants and ordering food, restaurant partner app for managing orders, delivery rider app for order fulfillment, real-time order tracking with GPS, in-app payment integration (JazzCash/EasyPaisa/Cards), push notifications for order updates, rating and review system, promo code and discount management. Target cities: Lahore, Karachi, Islamabad. Expected users: 10,000+ in first 6 months. Please provide examples of similar apps you've built.",
    category: "mobile",
    budget: { min: 300000, max: 400000, range: "300,000 - 400,000" },
    timeline: { value: "3-4", unit: "months" },
    clientId: userIds[1],
    clientInfo: { name: "Fatima Malik", email: "fatima.malik@yahoo.com", phone: "+92-321-2345678" },
    techStack: ["React Native", "Node.js", "MongoDB"],
    attachments: [],
    isInviteOnly: false,
    invitedCompanies: [],
    status: "posted",
    bids: [],
    paymentMethod: "easypaisa",
    milestones: [],
    viewCount: 89,
    createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    updatedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000)
  },
  {
    _id: projectIds[2],
    title: "SEO & Digital Marketing Campaign",
    description: "I need a comprehensive digital marketing strategy for my business: SEO optimization for website (on-page and off-page), social media marketing (Facebook, Instagram, LinkedIn), Google Ads campaign management, content creation (blog posts, social media posts), email marketing campaigns, monthly performance reports and analytics, competitor analysis. Industry: E-commerce/Retail. Target audience: Pakistani consumers aged 25-40. Current monthly marketing budget: PKR 100,000. Please include case studies from similar industries in your proposal.",
    category: "marketing",
    budget: { min: 80000, max: 120000, range: "80,000 - 120,000" },
    timeline: { value: "1-2", unit: "months" },
    clientId: userIds[2],
    clientInfo: { name: "Usman Raza", email: "usman.raza@hotmail.com", phone: "+92-333-3456789" },
    techStack: [],
    attachments: [],
    isInviteOnly: false,
    invitedCompanies: [],
    status: "closed",
    bids: [],
    paymentMethod: "bank",
    milestones: [],
    viewCount: 67,
    createdAt: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000), // 3 weeks ago
    updatedAt: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  },
  
  // More projects for BrowseProjectsPage.jsx
  {
    _id: projectIds[3],
    title: "Restaurant Management System",
    description: "Complete restaurant management system with table booking, menu management, order processing, and billing system.",
    category: "web",
    budget: { min: 200000, max: 300000, range: "200,000 - 300,000" },
    timeline: { value: "2-3", unit: "months" },
    clientId: userIds[3],
    clientInfo: { name: "Ayesha Siddiqui", email: "ayesha.siddiqui@gmail.com", phone: "+92-345-4567890" },
    techStack: ["React", "Node.js", "PostgreSQL"],
    attachments: [],
    status: "posted",
    bids: [],
    paymentMethod: "jazzcash",
    viewCount: 45,
    createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(now.getTime() + 29 * 24 * 60 * 60 * 1000)
  },
  {
    _id: projectIds[4],
    title: "Fitness Tracking App",
    description: "Mobile app for fitness tracking with workout plans, nutrition tracking, and progress analytics.",
    category: "mobile",
    budget: { min: 250000, max: 350000, range: "250,000 - 350,000" },
    timeline: { value: "3-4", unit: "months" },
    clientId: userIds[4],
    clientInfo: { name: "Bilal Ahmed", email: "bilal.ahmed@outlook.com", phone: "+92-301-5678901" },
    techStack: ["Flutter", "Firebase"],
    attachments: [],
    status: "posted",
    bids: [],
    paymentMethod: "easypaisa",
    viewCount: 78,
    createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000)
  },
  {
    _id: projectIds[5],
    title: "Social Media Marketing Strategy",
    description: "Comprehensive social media strategy for fashion brand targeting young adults in Pakistan.",
    category: "marketing",
    budget: { min: 60000, max: 90000, range: "60,000 - 90,000" },
    timeline: { value: "1-2", unit: "months" },
    clientId: userIds[5],
    clientInfo: { name: "Sana Hassan", email: "sana.hassan@gmail.com", phone: "+92-322-6789012" },
    techStack: [],
    attachments: [],
    status: "posted",
    bids: [],
    paymentMethod: "bank",
    viewCount: 32,
    createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(now.getTime() + 23 * 24 * 60 * 60 * 1000)
  },
  {
    _id: projectIds[6],
    title: "School Management System",
    description: "Complete school management system with student records, attendance, fee management, and exam system.",
    category: "web",
    budget: { min: 400000, max: 500000, range: "400,000 - 500,000" },
    timeline: { value: "4-5", unit: "months" },
    clientId: userIds[6],
    clientInfo: { name: "Imran Shah", email: "imran.shah@yahoo.com", phone: "+92-334-7890123" },
    techStack: ["Laravel", "Vue.js", "MySQL"],
    attachments: [],
    status: "posted",
    bids: [],
    paymentMethod: "jazzcash",
    viewCount: 56,
    createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(now.getTime() + 24 * 24 * 60 * 60 * 1000)
  },
  {
    _id: projectIds[7],
    title: "Healthcare Consultation App",
    description: "Telemedicine app connecting patients with doctors for online consultations.",
    category: "mobile",
    budget: { min: 350000, max: 450000, range: "350,000 - 450,000" },
    timeline: { value: "3-5", unit: "months" },
    clientId: userIds[7],
    clientInfo: { name: "Zainab Ali", email: "zainab.ali@gmail.com", phone: "+92-346-8901234" },
    techStack: ["React Native", "Node.js", "WebRTC"],
    attachments: [],
    status: "posted",
    bids: [],
    paymentMethod: "easypaisa",
    viewCount: 92,
    createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(now.getTime() + 22 * 24 * 60 * 60 * 1000)
  },
  {
    _id: projectIds[8],
    title: "Google Ads Optimization",
    description: "Optimize existing Google Ads campaigns for better ROI and lead generation.",
    category: "marketing",
    budget: { min: 40000, max: 70000, range: "40,000 - 70,000" },
    timeline: { value: "1", unit: "month" },
    clientId: userIds[8],
    clientInfo: { name: "Hamza Iqbal", email: "hamza.iqbal@hotmail.com", phone: "+92-302-9012345" },
    techStack: [],
    attachments: [],
    status: "posted",
    bids: [],
    paymentMethod: "bank",
    viewCount: 28,
    createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(now.getTime() + 26 * 24 * 60 * 60 * 1000)
  },
  {
    _id: projectIds[9],
    title: "Real Estate Portal",
    description: "Real estate listing portal with property search, agent profiles, and mortgage calculator.",
    category: "web",
    budget: { min: 300000, max: 400000, range: "300,000 - 400,000" },
    timeline: { value: "3-4", unit: "months" },
    clientId: userIds[9],
    clientInfo: { name: "Maria Khan", email: "maria.khan@gmail.com", phone: "+92-323-0123456" },
    techStack: ["Next.js", "TypeScript", "PostgreSQL"],
    attachments: [],
    status: "posted",
    bids: [],
    paymentMethod: "jazzcash",
    viewCount: 105,
    createdAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000)
  }
];

// Add more projects
for (let i = 10; i < 30; i++) {
  const categories = ["web", "mobile", "marketing", "design", "other"];
  const category = categories[i % 5];
  const clientIndex = i % 10;
  const timeAgo = (i % 10) * 2; // 0 to 18 days ago
  
  projects.push({
    _id: projectIds[i],
    title: `${category === "web" ? "Website" : category === "mobile" ? "Mobile App" : category === "marketing" ? "Marketing" : category === "design" ? "Design" : "Project"} ${i + 1}`,
    description: `This is a sample ${category} project description. We need professional services for this project with high quality standards.`,
    category: category,
    budget: { 
      min: 50000 + (i * 10000), 
      max: 150000 + (i * 15000),
      range: `${(50000 + (i * 10000)).toLocaleString()} - ${(150000 + (i * 15000)).toLocaleString()}`
    },
    timeline: { value: `${1 + (i % 3)}-${2 + (i % 4)}`, unit: i % 2 === 0 ? "months" : "weeks" },
    clientId: userIds[clientIndex],
    clientInfo: { 
      name: users[clientIndex].name, 
      email: users[clientIndex].email, 
      phone: users[clientIndex].phone 
    },
    techStack: category === "web" ? ["React", "Node.js"] : category === "mobile" ? ["React Native", "Firebase"] : [],
    attachments: [],
    status: "posted",
    bids: [],
    paymentMethod: i % 3 === 0 ? "jazzcash" : i % 3 === 1 ? "easypaisa" : "bank",
    viewCount: 30 + (i * 3),
    createdAt: new Date(now.getTime() - timeAgo * 24 * 60 * 60 * 1000),
    expiresAt: new Date(now.getTime() + (30 - timeAgo) * 24 * 60 * 60 * 1000)
  });
}

db.projects.insertMany(projects);
print("✅ Inserted 30 projects");

// ==========================================
// 4. CREATE BIDS (Align with BidSubmissionModal.jsx and DashboardPage.jsx)
// ==========================================
const bids = [
  // From DashboardPage.jsx companyBids array
  {
    _id: ObjectId(),
    projectId: projectIds[0],
    companyId: companyProfiles[0]._id,
    companyId_user: userIds[10], // Digital Dynamics
    amount: 200000,
    timeline: "8 weeks",
    proposal: "We have extensive experience building e-commerce platforms. Our team will deliver a scalable solution with all requested features.",
    milestones: [
      { title: "Design & Planning", amount: 40000, description: "Complete UI/UX design and project architecture" },
      { title: "Core Development", amount: 100000, description: "Development of main features" },
      { title: "Testing & Deployment", amount: 60000, description: "Testing and live deployment" }
    ],
    attachments: [],
    status: "pending",
    createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    clientName: "Ahmed Khan"
  },
  {
    _id: ObjectId(),
    projectId: projectIds[1],
    companyId: companyProfiles[1]._id,
    companyId_user: userIds[11], // Mobile Masters
    amount: 350000,
    timeline: "14 weeks",
    proposal: "We specialize in delivery apps and have built similar solutions. We'll use React Native for cross-platform compatibility.",
    milestones: [
      { title: "UI/UX Design", amount: 70000, description: "App design and wireframes" },
      { title: "User App Development", amount: 140000, description: "Customer-facing app development" },
      { title: "Admin & Driver Apps", amount: 140000, description: "Backend and admin panels" }
    ],
    attachments: [],
    status: "reviewed",
    createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    clientName: "Fatima Malik"
  },
  {
    _id: ObjectId(),
    projectId: projectIds[2],
    companyId: companyProfiles[2]._id,
    companyId_user: userIds[12], // Marketing Mavens
    amount: 100000,
    timeline: "6 weeks",
    proposal: "We'll create a comprehensive digital marketing strategy focusing on SEO and social media to maximize ROI.",
    milestones: [
      { title: "Strategy Development", amount: 30000, description: "Market research and strategy" },
      { title: "Implementation", amount: 40000, description: "Campaign execution" },
      { title: "Optimization", amount: 30000, description: "Performance analysis and optimization" }
    ],
    attachments: [],
    status: "rejected",
    createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    clientName: "Usman Raza"
  },
  
  // Additional bids for various projects
  {
    _id: ObjectId(),
    projectId: projectIds[3],
    companyId: companyProfiles[3]._id,
    companyId_user: userIds[13],
    amount: 250000,
    timeline: "10 weeks",
    proposal: "We have experience with restaurant management systems and can deliver a robust solution.",
    status: "pending",
    createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    clientName: "Ayesha Siddiqui"
  },
  {
    _id: ObjectId(),
    projectId: projectIds[4],
    companyId: companyProfiles[4]._id,
    companyId_user: userIds[14],
    amount: 300000,
    timeline: "12 weeks",
    proposal: "Fitness apps are our specialty. We'll include integration with wearables and health data.",
    status: "pending",
    createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
    clientName: "Bilal Ahmed"
  }
];

db.bids.insertMany(bids);
print("✅ Inserted bids");

// Update projects with bid references
bids.forEach(bid => {
  db.projects.updateOne(
    { _id: bid.projectId },
    { 
      $push: { 
        bids: {
          _id: bid._id,
          companyId: { _id: bid.companyId, name: companyProfiles.find(c => c._id.equals(bid.companyId))?.name },
          amount: bid.amount,
          timeline: bid.timeline,
          proposal: bid.proposal,
          milestones: bid.milestones || [],
          status: bid.status,
          createdAt: bid.createdAt
        }
      }
    }
  );
});

// Update dashboard project stats
db.projects.updateOne(
  { _id: projectIds[0] },
  { $set: { 
      invites: 5,
      bids: 8,
      views: 124
    } 
  }
);

db.projects.updateOne(
  { _id: projectIds[1] },
  { $set: { 
      invites: 3,
      bids: 5,
      views: 89
    } 
  }
);

db.projects.updateOne(
  { _id: projectIds[2] },
  { $set: { 
      invites: 4,
      bids: 3,
      views: 67
    } 
  }
);

// ==========================================
// 5. CREATE REVIEWS
// ==========================================
const reviews = [
  {
    _id: ObjectId(),
    companyId: companyProfiles[0]._id,
    userId: userIds[0],
    userName: "Ahmed Khan",
    rating: 5,
    comment: "Excellent work! Delivered on time and exceeded expectations.",
    projectId: projectIds[0],
    createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  },
  {
    _id: ObjectId(),
    companyId: companyProfiles[1]._id,
    userId: userIds[1],
    userName: "Fatima Malik",
    rating: 4,
    comment: "Good quality work, but communication could be better.",
    projectId: projectIds[1],
    createdAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000)
  },
  {
    _id: ObjectId(),
    companyId: companyProfiles[2]._id,
    userId: userIds[2],
    userName: "Usman Raza",
    rating: 5,
    comment: "Professional team, delivered exactly what was promised.",
    projectId: projectIds[2],
    createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
  }
];

db.reviews.insertMany(reviews);
print("✅ Inserted reviews");

// ==========================================
// FINAL SUMMARY
// ==========================================

print("\n================ SEEDING COMPLETE ================");
print(`✅ Total Users: ${db.users.countDocuments()} (10 clients, 20 companies, 1 admin)`);
print(`✅ Total Companies: ${db.companies.countDocuments()} (aligned with BrowsePage.jsx)`);
print(`✅ Total Projects: ${db.projects.countDocuments()} (aligned with frontend requirements)`);
print(`✅ Total Bids: ${db.bids.countDocuments()}`);
print(`✅ Total Reviews: ${db.reviews.countDocuments()}`);
print("\n================ FRONTEND ALIGNMENT ================");
print("✅ BrowsePage.jsx: 10 companies with matching data structure");
print("✅ BrowseProjectsPage.jsx: 30 projects with proper fields");
print("✅ DashboardPage.jsx: Projects and bids with correct status");
print("✅ BidSubmissionModal.jsx: Compatible bid structure");
print("✅ ProjectDetailPage.jsx: Complete project data with bids");
print("\n================ LOGIN CREDENTIALS ================");
print("🔑 Password for all accounts: 'password'");
print("👑 Admin: admin@techconnect.pk / password");
print("👤 Client: ahmed.khan@gmail.com / password");
print("🏢 Company: info@digitaldynamics.com / password");
print("\n✅ Database seeding completed successfully! Frontend should now display data correctly.");