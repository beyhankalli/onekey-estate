import Link from "next/link";
import { MapPin, Phone, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#1c3053] text-white pt-16 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          
          <div>
            <h3 className="text-2xl font-bold tracking-tighter mb-4">OneKey<span className="text-[#ae884e]">.</span></h3>
            <p className="text-blue-100 font-light leading-relaxed max-w-sm">
              Premium estate agency offering the finest properties in the UK. 
              Experience seamless online booking and immersive 3D tours.
            </p>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4 text-[#ae884e]">Quick Links</h4>
            <ul className="space-y-3 font-light text-blue-100">
              <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/listings" className="hover:text-white transition-colors">Properties</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4 text-[#ae884e]">Contact Us</h4>
            <ul className="space-y-4 font-light text-blue-100">
              <li className="flex items-start">
                <MapPin className="w-5 h-5 mr-3 shrink-0 text-[#ae884e]" />
                <span>Netherend Neighbourhood Centre<br />13 Mogul Lane, Halesowen<br />United Kingdom, B63 2QQ</span>
              </li>
              <li className="flex items-center">
                <Phone className="w-5 h-5 mr-3 shrink-0 text-[#ae884e]" />
                <span>+44 20 7946 0958</span>
              </li>
              <li className="flex items-center">
                <Mail className="w-5 h-5 mr-3 shrink-0 text-[#ae884e]" />
                <span>hello@onekeyestateagency.com</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-blue-900/50 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-blue-200 font-light">
          <p>&copy; {new Date().getFullYear()} OneKey Estate Agency. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}