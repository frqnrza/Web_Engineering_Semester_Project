import { Button } from "./ui/button";
import { FileText, ArrowLeft } from "lucide-react";
import PropTypes from 'prop-types';

export function TermsOfServicePage({ onNavigate, language = 'en' }) {
  const content = {
    en: {
      title: "Terms of Service",
      lastUpdated: "Last Updated: December 16, 2024",
      backButton: "Back",
      sections: [
        {
          title: "1. Acceptance of Terms",
          content: `By accessing and using TechConnect ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.`
        },
        {
          title: "2. Description of Service",
          content: `TechConnect provides a platform connecting businesses with verified technology companies in Pakistan. The Platform facilitates project posting, company discovery, bidding, messaging, and payment processing. We reserve the right to modify, suspend, or discontinue any aspect of the service at any time.`
        },
        {
          title: "3. User Accounts",
          subsections: [
            {
              subtitle: "3.1 Registration",
              text: "You must register for an account to access certain features. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete."
            },
            {
              subtitle: "3.2 Account Types",
              text: "TechConnect offers two types of accounts: Client accounts (for businesses seeking services) and Company accounts (for service providers). Each account type has different privileges and responsibilities."
            },
            {
              subtitle: "3.3 Account Security",
              text: "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account."
            },
            {
              subtitle: "3.4 Account Termination",
              text: "We reserve the right to suspend or terminate your account if you violate these terms or engage in fraudulent, abusive, or illegal activities."
            }
          ]
        },
        {
          title: "4. Company Verification",
          subsections: [
            {
              subtitle: "4.1 Verification Process",
              text: "Companies must submit required documentation for verification, including but not limited to: SECP registration, NTN certificate, CNIC, portfolio, and office verification. TechConnect reserves the right to accept or reject any verification application."
            },
            {
              subtitle: "4.2 Verified Badge",
              text: "The verified badge indicates that a company has completed our verification process. This does not constitute an endorsement or guarantee of service quality. Verified status may be revoked if false information is discovered."
            },
            {
              subtitle: "4.3 Re-verification",
              text: "Verified companies must undergo annual re-verification to maintain their verified status. Failure to complete re-verification will result in loss of verified badge."
            }
          ]
        },
        {
          title: "5. Projects and Bidding",
          subsections: [
            {
              subtitle: "5.1 Project Posting",
              text: "Clients may post projects with detailed requirements, budget, and timeline. All project information must be accurate and complete. TechConnect reserves the right to remove projects that violate our guidelines."
            },
            {
              subtitle: "5.2 Bidding",
              text: "Verified companies may submit bids on projects. Bids constitute a binding offer and cannot be withdrawn after acceptance. Companies must honor accepted bids unless mutually agreed otherwise."
            },
            {
              subtitle: "5.3 Project Agreements",
              text: "Once a bid is accepted, both parties enter into a contractual agreement. TechConnect is not a party to this agreement and is not responsible for disputes between clients and companies."
            }
          ]
        },
        {
          title: "6. Payments and Fees",
          subsections: [
            {
              subtitle: "6.1 Payment Processing",
              text: "TechConnect facilitates payments through JazzCash, EasyPaisa, and bank transfers. All payments are subject to applicable transaction fees and taxes."
            },
            {
              subtitle: "6.2 Escrow Service",
              text: "Payments are held in escrow until milestone completion and client approval. Escrow protects both clients and companies but does not guarantee project success."
            },
            {
              subtitle: "6.3 Platform Fees",
              text: "TechConnect charges a service fee on completed transactions. Fee structure will be clearly communicated before payment processing. Fees are non-refundable except as required by law."
            },
            {
              subtitle: "6.4 Refunds",
              text: "Refunds are processed according to our refund policy. Disputed payments may be held pending resolution. We reserve the right to withhold refunds in cases of fraud or terms violation."
            }
          ]
        },
        {
          title: "7. User Conduct",
          content: `Users must not: (a) violate any applicable laws or regulations; (b) infringe on intellectual property rights; (c) post false or misleading information; (d) harass, abuse, or harm other users; (e) attempt to gain unauthorized access to the Platform; (f) interfere with the Platform's operation; (g) collect user information without consent; (h) engage in any fraudulent activities.`
        },
        {
          title: "8. Intellectual Property",
          content: `The Platform and its original content, features, and functionality are owned by TechConnect and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. Users retain ownership of content they post but grant TechConnect a license to use, display, and distribute such content on the Platform.`
        },
        {
          title: "9. Dispute Resolution",
          subsections: [
            {
              subtitle: "9.1 Client-Company Disputes",
              text: "Disputes between clients and companies should be resolved directly between parties. TechConnect may provide mediation services but is not obligated to do so."
            },
            {
              subtitle: "9.2 Platform Disputes",
              text: "Any disputes with TechConnect must be resolved through arbitration in Islamabad, Pakistan, under Pakistani law."
            }
          ]
        },
        {
          title: "10. Limitation of Liability",
          content: `TechConnect is provided "as is" without warranties of any kind. We are not liable for: (a) indirect, incidental, or consequential damages; (b) loss of profits, data, or business opportunities; (c) actions or omissions of users; (d) quality of services provided by companies; (e) payment disputes between users. Our total liability shall not exceed the amount of fees paid by you in the past 12 months.`
        },
        {
          title: "11. Privacy and Data Protection",
          content: `Your use of TechConnect is also governed by our Privacy Policy. We collect, use, and protect your personal information as described in our Privacy Policy. By using the Platform, you consent to such collection and use.`
        },
        {
          title: "12. Modifications to Terms",
          content: `We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting. Your continued use of the Platform after changes constitutes acceptance of the modified terms. We will notify users of significant changes via email or platform notification.`
        },
        {
          title: "13. Governing Law",
          content: `These Terms shall be governed by and construed in accordance with the laws of Pakistan. Any legal action or proceeding arising under these Terms shall be brought exclusively in the courts of Islamabad, Pakistan.`
        },
        {
          title: "14. Contact Information",
          content: `For questions about these Terms of Service, please contact us at:\n\nEmail: legal@techconnect.pk\nPhone: +92 300 1234567\nAddress: TechConnect, Islamabad, Pakistan`
        }
      ]
    },
    ur: {
      title: "خدمات کی شرائط",
      lastUpdated: "آخری تازہ کاری: 16 دسمبر 2024",
      backButton: "واپس",
      sections: [
        {
          title: "1. شرائط کی قبولیت",
          content: `ٹیک کنیکٹ ("پلیٹ فارم") تک رسائی اور استعمال کرتے ہوئے، آپ اس معاہدے کی شرائط اور دفعات سے پابند ہونے کو قبول کرتے ہیں۔ اگر آپ مذکورہ بالا سے متفق نہیں ہیں تو براہ کرم اس سروس کو استعمال نہ کریں۔`
        },
        {
          title: "2. سروس کی تفصیل",
          content: `ٹیک کنیکٹ پاکستان میں کاروباروں کو تصدیق شدہ ٹیکنالوجی کمپنیوں سے جوڑنے والا پلیٹ فارم فراہم کرتا ہے۔ یہ پلیٹ فارم پروجیکٹ پوسٹنگ، کمپنی کی دریافت، بولی لگانے، پیغام رسانی، اور ادائیگی کی کارروائی میں سہولت فراہم کرتا ہے۔`
        },
        {
          title: "3. صارف اکاؤنٹس",
          content: `آپ کو کچھ خصوصیات تک رسائی کے لیے اکاؤنٹ رجسٹر کرنا ہوگا۔ آپ رجسٹریشن کے دوران درست، موجودہ، اور مکمل معلومات فراہم کرنے پر اتفاق کرتے ہیں۔`
        },
        {
          title: "4. کمپنی کی تصدیق",
          content: `کمپنیوں کو تصدیق کے لیے مطلوبہ دستاویزات جمع کرانی ہوں گی بشمول: SECP رجسٹریشن، NTN سرٹیفکیٹ، CNIC، پورٹ فولیو، اور دفتر کی تصدیق۔`
        },
        {
          title: "5. پروجیکٹس اور بولی لگانا",
          content: `کلائنٹس تفصیلی تقاضوں، بجٹ، اور ٹائم لائن کے ساتھ پروجیکٹس پوسٹ کر سکتے ہیں۔ تصدیق شدہ کمپنیاں پروجیکٹس پر بولیاں جمع کرا سکتی ہیں۔`
        },
        {
          title: "6. ادائیگیاں اور فیس",
          content: `ٹیک کنیکٹ جاز کیش، ایزی پیسہ، اور بینک ٹرانسفر کے ذریعے ادائیگیوں میں سہولت فراہم کرتا ہے۔ تمام ادائیگیاں قابل اطلاق ٹرانزیکشن فیس اور ٹیکس کے تابع ہیں۔`
        },
        {
          title: "7. صارف کا طرز عمل",
          content: `صارفین کو نہیں کرنا چاہیے: (الف) کسی بھی قابل اطلاق قوانین کی خلاف ورزی؛ (ب) دانشورانہ املاک کے حقوق کی خلاف ورزی؛ (ج) غلط یا گمراہ کن معلومات پوسٹ کرنا۔`
        },
        {
          title: "8. دانشورانہ املاک",
          content: `پلیٹ فارم اور اس کا اصل مواد، خصوصیات، اور فعالیت ٹیک کنیکٹ کی ملکیت ہے اور بین الاقوامی کاپی رائٹ قوانین سے محفوظ ہے۔`
        },
        {
          title: "9. تنازعات کا حل",
          content: `کلائنٹس اور کمپنیوں کے درمیان تنازعات براہ راست فریقین کے درمیان حل کیے جائیں۔ ٹیک کنیکٹ ثالثی کی خدمات فراہم کر سکتا ہے لیکن ایسا کرنے کا پابند نہیں ہے۔`
        },
        {
          title: "10. ذمہ داری کی حد",
          content: `ٹیک کنیکٹ "جیسا ہے" فراہم کیا جاتا ہے۔ ہم ذمہ دار نہیں ہیں: (الف) بالواسطہ نقصانات؛ (ب) منافع، ڈیٹا کا نقصان؛ (ج) صارفین کی کارروائیاں یا کوتاہیاں۔`
        },
        {
          title: "11. رازداری اور ڈیٹا کا تحفظ",
          content: `ٹیک کنیکٹ کا آپ کا استعمال ہماری رازداری کی پالیسی کے تحت بھی ہے۔ ہم آپ کی ذاتی معلومات کو جمع، استعمال، اور محفوظ کرتے ہیں جیسا کہ ہماری رازداری کی پالیسی میں بیان کیا گیا ہے۔`
        },
        {
          title: "12. شرائط میں تبدیلیاں",
          content: `ہم کسی بھی وقت ان شرائط میں ترمیم کا حق محفوظ رکھتے ہیں۔ تبدیلیاں پوسٹ کرنے کے فوراً بعد مؤثر ہوں گی۔ تبدیلیوں کے بعد پلیٹ فارم کا آپ کا مسلسل استعمال ترمیم شدہ شرائط کی قبولیت کی تشکیل کرتا ہے۔`
        },
        {
          title: "13. حاکم قانون",
          content: `یہ شرائط پاکستان کے قوانین کے مطابق چلائی جائیں گی۔ ان شرائط کے تحت پیدا ہونے والی کوئی بھی قانونی کارروائی خصوصی طور پر اسلام آباد، پاکستان کی عدالتوں میں لائی جائے گی۔`
        },
        {
          title: "14. رابطے کی معلومات",
          content: `ان شرائط کے بارے میں سوالات کے لیے، براہ کرم ہم سے رابطہ کریں:\n\nای میل: legal@techconnect.pk\nفون: 0300 1234567+92\nپتہ: ٹیک کنیکٹ، اسلام آباد، پاکستان`
        }
      ]
    }
  };

  const currentContent = content[language];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => onNavigate('home')}
            className="mb-4 hover:bg-gray-100"
          >
            <ArrowLeft className="mr-2" size={18} />
            {currentContent.backButton}
          </Button>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-[#0A2540] rounded-lg flex items-center justify-center">
              <FileText className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#0A2540]">
                {currentContent.title}
              </h1>
              <p className="text-sm text-gray-600">{currentContent.lastUpdated}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg border p-8 shadow-sm">
          <div className="prose prose-slate max-w-none">
            {currentContent.sections.map((section, index) => (
              <div key={index} className="mb-8 last:mb-0">
                <h2 className="text-xl font-bold text-[#0A2540] mb-4">
                  {section.title}
                </h2>
                
                {section.content && (
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line mb-4">
                    {section.content}
                  </p>
                )}

                {section.subsections && (
                  <div className="space-y-4 ml-4">
                    {section.subsections.map((subsection, subIndex) => (
                      <div key={subIndex}>
                        <h3 className="text-lg font-semibold text-[#0A2540] mb-2">
                          {subsection.subtitle}
                        </h3>
                        <p className="text-gray-700 leading-relaxed">
                          {subsection.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer Notice */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-sm text-blue-800">
                {language === 'en' 
                  ? '📌 These Terms of Service constitute a legally binding agreement between you and TechConnect. Please read them carefully. If you have any questions or concerns, please contact our legal team.'
                  : '📌 یہ خدمات کی شرائط آپ اور ٹیک کنیکٹ کے درمیان ایک قانونی طور پر پابند معاہدہ تشکیل دیتی ہیں۔ براہ کرم انہیں احتیاط سے پڑھیں۔ اگر آپ کے کوئی سوالات یا خدشات ہیں تو براہ کرم ہماری قانونی ٹیم سے رابطہ کریں۔'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            {language === 'en' 
              ? 'Have questions about our Terms of Service?'
              : 'ہماری خدمات کی شرائط کے بارے میں سوالات ہیں؟'
            }
          </p>
          <Button
            onClick={() => onNavigate('contact')}
            className="bg-[#008C7E] hover:bg-[#007066] text-white"
          >
            {language === 'en' ? 'Contact Us' : 'ہم سے رابطہ کریں'}
          </Button>
        </div>
      </div>
    </div>
  );
}

TermsOfServicePage.propTypes = {
  onNavigate: PropTypes.func.isRequired,
  language: PropTypes.oneOf(['en', 'ur'])
};