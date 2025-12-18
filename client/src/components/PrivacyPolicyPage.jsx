import { Button } from "./ui/button";
import { Shield, ArrowLeft } from "lucide-react";
import PropTypes from 'prop-types';

export function PrivacyPolicyPage({ onNavigate, language = 'en' }) {
  const content = {
    en: {
      title: "Privacy Policy",
      lastUpdated: "Last Updated: December 16, 2024",
      backButton: "Back",
      sections: [
        {
          title: "1. Introduction",
          content: `TechConnect ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the platform.`
        },
        {
          title: "2. Information We Collect",
          subsections: [
            {
              subtitle: "2.1 Personal Information",
              text: "We collect personal information that you voluntarily provide when registering on the Platform, including: name, email address, phone number, company name (for businesses), CNIC number (for verification), business registration documents, profile pictures, payment information, and correspondence data."
            },
            {
              subtitle: "2.2 Automatically Collected Information",
              text: "When you access the Platform, we automatically collect certain information including: IP address, browser type and version, time zone setting, operating system, device information, usage data (pages visited, time spent, clicks), and cookies data."
            },
            {
              subtitle: "2.3 Information from Third Parties",
              text: "We may receive information about you from third-party services such as Google OAuth (if you choose to sign in with Google), payment gateways (JazzCash, EasyPaisa), and verification services."
            }
          ]
        },
        {
          title: "3. How We Use Your Information",
          content: `We use the information we collect for the following purposes:\n\n• To create and manage your account\n• To verify company credentials and documents\n• To facilitate project posting and bidding\n• To process payments and maintain escrow accounts\n• To enable messaging between users\n• To send important notifications and updates\n• To improve our services and user experience\n• To prevent fraud and enhance security\n• To comply with legal obligations\n• To resolve disputes and enforce agreements\n• To provide customer support\n• To send marketing communications (with your consent)`
        },
        {
          title: "4. How We Share Your Information",
          subsections: [
            {
              subtitle: "4.1 With Other Users",
              text: "Certain information is shared with other users to facilitate the platform's functionality: Company profiles are visible to clients, project details are visible to companies, and messaging content is shared between conversation participants."
            },
            {
              subtitle: "4.2 With Service Providers",
              text: "We share information with third-party service providers who perform services on our behalf: payment processors (JazzCash, EasyPaisa, banks), cloud storage providers (Cloudinary), email service providers, and analytics providers."
            },
            {
              subtitle: "4.3 For Legal Reasons",
              text: "We may disclose your information if required by law, to respond to legal processes, to protect our rights and property, to prevent fraud or security issues, or in connection with a business transfer (merger, acquisition, sale)."
            },
            {
              subtitle: "4.4 With Your Consent",
              text: "We may share your information for any other purpose with your explicit consent."
            }
          ]
        },
        {
          title: "5. Data Security",
          content: `We implement appropriate technical and organizational security measures to protect your information, including: encryption of sensitive data (passwords, payment information), secure HTTPS connections, regular security audits, access controls and authentication, secure cloud storage, and regular backups. However, no method of transmission over the Internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.`
        },
        {
          title: "6. Data Retention",
          content: `We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required by law. Specifically:\n\n• Account information: Retained while your account is active and for 1 year after closure\n• Transaction records: Retained for 7 years (as required by financial regulations)\n• Communication records: Retained for 2 years\n• Verification documents: Retained while company is verified and for 1 year after verification expires\n\nYou may request deletion of your data at any time, subject to legal retention requirements.`
        },
        {
          title: "7. Your Rights and Choices",
          subsections: [
            {
              subtitle: "7.1 Access and Correction",
              text: "You have the right to access and update your personal information at any time through your account settings."
            },
            {
              subtitle: "7.2 Data Deletion",
              text: "You may request deletion of your account and associated data by contacting us at privacy@techconnect.pk. Some information may be retained as required by law."
            },
            {
              subtitle: "7.3 Marketing Communications",
              text: "You can opt-out of marketing emails by clicking the unsubscribe link or updating your preferences in account settings."
            },
            {
              subtitle: "7.4 Cookie Preferences",
              text: "You can control cookies through your browser settings. Note that disabling certain cookies may affect platform functionality."
            },
            {
              subtitle: "7.5 Data Portability",
              text: "You have the right to request a copy of your data in a structured, commonly used format."
            }
          ]
        },
        {
          title: "8. Cookies and Tracking Technologies",
          content: `We use cookies and similar tracking technologies to enhance your experience:\n\n• Essential Cookies: Required for platform functionality (authentication, security)\n• Analytics Cookies: Help us understand how you use the platform\n• Preference Cookies: Remember your settings and preferences\n• Marketing Cookies: Used to deliver relevant advertisements (with consent)\n\nYou can manage cookie preferences through your browser settings.`
        },
        {
          title: "9. Third-Party Links",
          content: `Our Platform may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies before providing any personal information.`
        },
        {
          title: "10. Children's Privacy",
          content: `TechConnect is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected information from a child, we will take steps to delete such information promptly.`
        },
        {
          title: "11. International Data Transfers",
          content: `Your information may be transferred to and processed in countries other than Pakistan. We ensure that such transfers comply with applicable data protection laws and that appropriate safeguards are in place.`
        },
        {
          title: "12. Changes to This Privacy Policy",
          content: `We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. We will also send you an email notification for significant changes. Your continued use of the Platform after changes become effective constitutes acceptance of the revised policy.`
        },
        {
          title: "13. Contact Us",
          content: `If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:\n\nPrivacy Team\nEmail: privacy@techconnect.pk\nPhone: +92 300 1234567\nAddress: TechConnect, Islamabad, Pakistan\n\nData Protection Officer: dpo@techconnect.pk`
        },
        {
          title: "14. Compliance with Pakistani Laws",
          content: `TechConnect complies with applicable Pakistani data protection laws, including the Prevention of Electronic Crimes Act (PECA) 2016 and relevant regulations. We are committed to protecting your privacy in accordance with local legal requirements.`
        }
      ]
    },
    ur: {
      title: "رازداری کی پالیسی",
      lastUpdated: "آخری تازہ کاری: 16 دسمبر 2024",
      backButton: "واپس",
      sections: [
        {
          title: "1. تعارف",
          content: `ٹیک کنیکٹ ("ہم"، "ہمارا"، یا "ہمیں") آپ کی رازداری کی حفاظت کے لیے پرعزم ہے۔ یہ رازداری کی پالیسی بیان کرتی ہے کہ جب آپ ہمارا پلیٹ فارم استعمال کرتے ہیں تو ہم آپ کی معلومات کو کیسے جمع، استعمال، ظاہر، اور محفوظ کرتے ہیں۔`
        },
        {
          title: "2. ہم کون سی معلومات جمع کرتے ہیں",
          content: `ہم ذاتی معلومات جمع کرتے ہیں جو آپ رجسٹریشن کے دوران فراہم کرتے ہیں بشمول: نام، ای میل ایڈریس، فون نمبر، کمپنی کا نام، CNIC نمبر، کاروباری رجسٹریشن دستاویزات، پروفائل تصاویر، ادائیگی کی معلومات، اور خط و کتابت کا ڈیٹا۔`
        },
        {
          title: "3. ہم آپ کی معلومات کو کیسے استعمال کرتے ہیں",
          content: `ہم جمع کی گئی معلومات کو مندرجہ ذیل مقاصد کے لیے استعمال کرتے ہیں:\n\n• آپ کا اکاؤنٹ بنانے اور منظم کرنے کے لیے\n• کمپنی کی سند اور دستاویزات کی تصدیق کے لیے\n• پروجیکٹ پوسٹنگ اور بولی لگانے میں سہولت کے لیے\n• ادائیگیوں کی کارروائی اور ایسکرو اکاؤنٹس کی دیکھ بھال کے لیے\n• صارفین کے درمیان پیغام رسانی کو فعال کرنے کے لیے\n• اہم اطلاعات اور تازہ کاریاں بھیجنے کے لیے`
        },
        {
          title: "4. ہم آپ کی معلومات کیسے شیئر کرتے ہیں",
          content: `کچھ معلومات دوسرے صارفین کے ساتھ شیئر کی جاتی ہیں: کمپنی کے پروفائلز کلائنٹس کو نظر آتے ہیں، پروجیکٹ کی تفصیلات کمپنیوں کو نظر آتی ہیں، اور پیغام رسانی کا مواد گفتگو میں شامل افراد کے درمیان شیئر کیا جاتا ہے۔`
        },
        {
          title: "5. ڈیٹا کی سیکیورٹی",
          content: `ہم آپ کی معلومات کی حفاظت کے لیے مناسب تکنیکی اور تنظیمی سیکیورٹی اقدامات کو نافذ کرتے ہیں بشمول: حساس ڈیٹا کی خفیہ کاری، محفوظ HTTPS کنکشنز، باقاعدہ سیکیورٹی آڈٹ، رسائی کے کنٹرولز اور تصدیق، محفوظ کلاؤڈ اسٹوریج، اور باقاعدہ بیک اپ۔`
        },
        {
          title: "6. ڈیٹا کی برقراری",
          content: `ہم آپ کی ذاتی معلومات کو اس وقت تک برقرار رکھتے ہیں جب تک اس رازداری کی پالیسی میں بیان کردہ مقاصد کو پورا کرنا ضروری ہو، جب تک کہ قانون کے ذریعہ طویل مدت کی ضرورت نہ ہو۔`
        },
        {
          title: "7. آپ کے حقوق اور انتخاب",
          content: `آپ کو اپنی ذاتی معلومات تک رسائی اور انہیں کسی بھی وقت اپنی اکاؤنٹ کی ترتیبات کے ذریعے اپ ڈیٹ کرنے کا حق ہے۔ آپ اپنے اکاؤنٹ اور متعلقہ ڈیٹا کو حذف کرنے کی درخواست کر سکتے ہیں۔`
        },
        {
          title: "8. کوکیز اور ٹریکنگ ٹیکنالوجیز",
          content: `ہم آپ کے تجربے کو بہتر بنانے کے لیے کوکیز اور اسی طرح کی ٹریکنگ ٹیکنالوجیز استعمال کرتے ہیں۔ آپ اپنے براؤزر کی ترتیبات کے ذریعے کوکی کی ترجیحات کا انتظام کر سکتے ہیں۔`
        },
        {
          title: "9. تیسری پارٹی کے لنکس",
          content: `ہمارے پلیٹ فارم میں تیسری پارٹی کی ویب سائٹس یا خدمات کے لنکس شامل ہو سکتے ہیں۔ ہم ان تیسری پارٹیوں کے رازداری کے طریقوں کے لیے ذمہ دار نہیں ہیں۔`
        },
        {
          title: "10. بچوں کی رازداری",
          content: `ٹیک کنیکٹ 18 سال سے کم عمر افراد کے لیے نہیں ہے۔ ہم جان بوجھ کر بچوں سے ذاتی معلومات جمع نہیں کرتے۔`
        },
        {
          title: "11. بین الاقوامی ڈیٹا کی منتقلی",
          content: `آپ کی معلومات پاکستان کے علاوہ دیگر ممالک میں منتقل اور پروسیس کی جا سکتی ہیں۔ ہم اس بات کو یقینی بناتے ہیں کہ ایسی منتقلیاں قابل اطلاق ڈیٹا تحفظ کے قوانین کی تعمیل کریں۔`
        },
        {
          title: "12. اس رازداری کی پالیسی میں تبدیلیاں",
          content: `ہم وقتاً فوقتاً اس رازداری کی پالیسی کو اپ ڈیٹ کر سکتے ہیں۔ ہم کسی بھی اہم تبدیلیوں کے بارے میں آپ کو نئی رازداری کی پالیسی کو اس صفحہ پر پوسٹ کرکے اور "آخری تازہ کاری" کی تاریخ کو اپ ڈیٹ کرکے مطلع کریں گے۔`
        },
        {
          title: "13. ہم سے رابطہ کریں",
          content: `اگر آپ کے اس رازداری کی پالیسی یا ہماری ڈیٹا کے طریقوں کے بارے میں کوئی سوالات، خدشات، یا درخواستیں ہیں تو براہ کرم ہم سے رابطہ کریں:\n\nرازداری ٹیم\nای میل: privacy@techconnect.pk\nفون: 0300 1234567+92\nپتہ: ٹیک کنیکٹ، اسلام آباد، پاکستان`
        },
        {
          title: "14. پاکستانی قوانین کی تعمیل",
          content: `ٹیک کنیکٹ قابل اطلاق پاکستانی ڈیٹا تحفظ کے قوانین کی تعمیل کرتا ہے بشمول الیکٹرانک جرائم کی روک تھام ایکٹ (PECA) 2016 اور متعلقہ ضوابط۔`
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
            <div className="w-12 h-12 bg-[#008C7E] rounded-lg flex items-center justify-center">
              <Shield className="text-white" size={24} />
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
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <p className="text-sm text-green-800">
                {language === 'en' 
                  ? '🔒 Your privacy is important to us. We are committed to protecting your personal information and being transparent about our data practices. This policy explains your rights and how to exercise them.'
                  : '🔒 آپ کی رازداری ہمارے لیے اہم ہے۔ ہم آپ کی ذاتی معلومات کی حفاظت اور اپنے ڈیٹا کے طریقوں کے بارے میں شفاف ہونے کے لیے پرعزم ہیں۔ یہ پالیسی آپ کے حقوق اور انہیں استعمال کرنے کا طریقہ بیان کرتی ہے۔'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            {language === 'en' 
              ? 'Questions about how we handle your data?'
              : 'ہم آپ کے ڈیٹا کو کیسے ہینڈل کرتے ہیں اس کے بارے میں سوالات؟'
            }
          </p>
          <Button
            onClick={() => onNavigate('contact')}
            className="bg-[#008C7E] hover:bg-[#007066] text-white"
          >
            {language === 'en' ? 'Contact Privacy Team' : 'رازداری ٹیم سے رابطہ کریں'}
          </Button>
        </div>
      </div>
    </div>
  );
}

PrivacyPolicyPage.propTypes = {
  onNavigate: PropTypes.func.isRequired,
  language: PropTypes.oneOf(['en', 'ur'])
};