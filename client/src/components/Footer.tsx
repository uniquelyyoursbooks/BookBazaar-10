import { Link } from "wouter";
import { BookOpen } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#333333] text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="text-2xl font-bold font-['Merriweather'] flex items-center mb-4">
              <BookOpen className="mr-2" />
              <span>BookVerse</span>
            </div>
            <p className="text-gray-400 mb-4">The premier platform for self-published authors to share their stories with the world.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white">
                <i className="fab fa-facebook-f">🔗</i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <i className="fab fa-twitter">🔗</i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <i className="fab fa-instagram">🔗</i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <i className="fab fa-linkedin-in">🔗</i>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">For Authors</h3>
            <ul className="space-y-2">
              <li><Link href="/upload" className="text-gray-400 hover:text-white">How to Publish</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white">Author Resources</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white">Marketing Tips</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white">Success Stories</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white">Author Community</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">For Readers</h3>
            <ul className="space-y-2">
              <li><Link href="/search" className="text-gray-400 hover:text-white">Browse Books</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white">Reading Lists</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white">Book Clubs</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white">Review Guidelines</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white">Reading App</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Company</h3>
            <ul className="space-y-2">
              <li><Link href="#" className="text-gray-400 hover:text-white">About Us</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white">Careers</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white">Press</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white">Contact</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white">Terms & Privacy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} BookVerse. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
