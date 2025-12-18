import { Input } from "./ui/input";
import { Button } from "./ui/button";
import PropTypes from 'prop-types';

export function Footer({ language = 'en', onNavigate }) {
  return (
    <footer className="bg-[#0A2540] text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Column 1 */}
          <div className="lg:col-span-1">
            <div className="mb-4 font-bold text-lg">TechConnect</div>
            <p className="text-sm text-gray-300">
              {language === 'en' 
                ? 'Connecting Pakistani businesses with verified tech companies.'
                : 'پاکستانی کاروباروں کو تصدیق شدہ ٹیک کمپنیوں سے جوڑنا۔'}
            </p>
          </div>

          {/* Column 2 */}
          <div className="lg:col-span-1">
            <div className="mb-4 font-semibold">{language === 'en' ? 'Quick Links' : 'فوری لنکس'}</div>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); onNavigate?.('browse'); }}
                  className="hover:text-[#008C7E] transition-colors"
                >
                  {language === 'en' ? 'Browse Companies' : 'کمپنیاں براؤز کریں'}
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); onNavigate?.('post-project'); }}
                  className="hover:text-[#008C7E] transition-colors"
                >
                  {language === 'en' ? 'Post a Project' : 'پروجیکٹ پوسٹ کریں'}
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); onNavigate?.('about'); }}
                  className="hover:text-[#008C7E] transition-colors"
                >
                  {language === 'en' ? 'How it Works' : 'یہ کیسے کام کرتا ہے'}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#008C7E] transition-colors">
                  {language === 'en' ? 'Pricing' : 'قیمتوں کا تعین'}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3 */}
          <div className="lg:col-span-1">
            <div className="mb-4 font-semibold">{language === 'en' ? 'For Companies' : 'کمپنیوں کے لیے'}</div>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <a href="#" className="hover:text-[#008C7E] transition-colors">
                  {language === 'en' ? 'Get Verified' : 'تصدیق شدہ حاصل کریں'}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#008C7E] transition-colors">
                  {language === 'en' ? 'Company Sign Up' : 'کمپنی سائن اپ'}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#008C7E] transition-colors">
                  {language === 'en' ? 'Resources' : 'وسائل'}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4 */}
          <div className="lg:col-span-1">
            <div className="mb-4 font-semibold">{language === 'en' ? 'Support' : 'سپورٹ'}</div>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <a href="#" className="hover:text-[#008C7E] transition-colors">
                  {language === 'en' ? 'Help Center' : 'مدد کا مرکز'}
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); onNavigate?.('contact'); }}
                  className="hover:text-[#008C7E] transition-colors"
                >
                  {language === 'en' ? 'Contact Us' : 'ہم سے رابطہ کریں'}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#008C7E] transition-colors">
                  {language === 'en' ? 'Privacy Policy' : 'رازداری کی پالیسی'}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#008C7E] transition-colors">
                  {language === 'en' ? 'Terms of Service' : 'سروس کی شرائط'}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 5 */}
          <div className="lg:col-span-1">
            <div className="mb-4 font-semibold">{language === 'en' ? 'Stay Updated' : 'اپ ڈیٹ رہیں'}</div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input 
                placeholder={language === 'en' ? 'Enter your email' : 'اپنی ای میل درج کریں'} 
                className="bg-white text-black h-10 flex-1"
              />
              <Button className="bg-[#008C7E] hover:bg-[#007066] h-10">
                {language === 'en' ? 'Subscribe' : 'سبسکرائب کریں'}
              </Button>
            </div>
            <div className="mt-4 flex gap-3 text-sm text-gray-300">
              <a href="#" className="hover:text-[#008C7E] transition-colors">Facebook</a>
              <a href="#" className="hover:text-[#008C7E] transition-colors">Twitter</a>
              <a href="#" className="hover:text-[#008C7E] transition-colors">LinkedIn</a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-700 text-center text-sm text-gray-400">
          © 2025 TechConnect. {language === 'en' ? 'All rights reserved.' : 'تمام حقوق محفوظ ہیں۔'}
        </div>
      </div>
    </footer>
  );
}

Footer.propTypes = {
  language: PropTypes.oneOf(['en', 'ur']),
  onNavigate: PropTypes.func
};