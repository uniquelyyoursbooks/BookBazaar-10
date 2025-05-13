import React from "react";
import { Link } from "wouter";

const Footer: React.FC = () => {
  return (
    <footer className="bg-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <div className="flex items-center">
              <i className="fas fa-book-open text-secondary text-xl mr-2"></i>
              <span className="text-xl font-bold text-primary serif">BookNest</span>
            </div>
            <p className="text-neutral-600 text-base">
              Empowering authors to publish, share, and profit from their stories without the gatekeepers.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-neutral-400 hover:text-neutral-700">
                <i className="fab fa-facebook-f"></i>
                <span className="sr-only">Facebook</span>
              </a>
              <a href="#" className="text-neutral-400 hover:text-neutral-700">
                <i className="fab fa-instagram"></i>
                <span className="sr-only">Instagram</span>
              </a>
              <a href="#" className="text-neutral-400 hover:text-neutral-700">
                <i className="fab fa-twitter"></i>
                <span className="sr-only">Twitter</span>
              </a>
              <a href="#" className="text-neutral-400 hover:text-neutral-700">
                <i className="fab fa-youtube"></i>
                <span className="sr-only">YouTube</span>
              </a>
            </div>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-neutral-700 tracking-wider uppercase">
                  Platform
                </h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <Link href="/" className="text-base text-neutral-600 hover:text-neutral-900">
                      How it Works
                    </Link>
                  </li>
                  <li>
                    <Link href="/read/1" className="text-base text-neutral-600 hover:text-neutral-900">
                      Reader Experience
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard" className="text-base text-neutral-600 hover:text-neutral-900">
                      Author Tools
                    </Link>
                  </li>
                  <li>
                    <Link href="/" className="text-base text-neutral-600 hover:text-neutral-900">
                      Pricing
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-neutral-700 tracking-wider uppercase">
                  Support
                </h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <a href="#" className="text-base text-neutral-600 hover:text-neutral-900">
                      Help Center
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-base text-neutral-600 hover:text-neutral-900">
                      Formatting Guide
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-base text-neutral-600 hover:text-neutral-900">
                      Community
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-base text-neutral-600 hover:text-neutral-900">
                      Contact Us
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-neutral-700 tracking-wider uppercase">
                  Company
                </h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <a href="#" className="text-base text-neutral-600 hover:text-neutral-900">
                      About
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-base text-neutral-600 hover:text-neutral-900">
                      Blog
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-base text-neutral-600 hover:text-neutral-900">
                      Careers
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-base text-neutral-600 hover:text-neutral-900">
                      Press
                    </a>
                  </li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-neutral-700 tracking-wider uppercase">
                  Legal
                </h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <a href="#" className="text-base text-neutral-600 hover:text-neutral-900">
                      Privacy
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-base text-neutral-600 hover:text-neutral-900">
                      Terms
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-base text-neutral-600 hover:text-neutral-900">
                      Copyright
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-base text-neutral-600 hover:text-neutral-900">
                      Cookies
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-neutral-200 pt-8">
          <p className="text-base text-neutral-500 xl:text-center">
            &copy; 2023 BookNest. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
