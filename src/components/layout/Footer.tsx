import React from 'react';
import { Link } from 'react-router-dom';
import { STITCH_LOGO_URL } from '../../data/products';

export const Footer: React.FC = () => {
  return (
    <footer
      className="bg-[#104332] text-white pt-16 pb-10 border-t border-[#185540]"
      data-purpose="site-footer"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-16 border-b border-white/10">
          {/* Brand Description Col */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-3.5 mb-6">
              <img
                src={STITCH_LOGO_URL}
                alt="The Sniff Co."
                className="h-8 w-auto object-contain"
              />
            </div>
            <p className="text-xs text-emerald-100/70 max-w-sm mb-4 leading-relaxed font-normal">
              Made for the nose that knows.
              <br />
              Made in India.
            </p>
            <p className="text-xs text-emerald-100/70 font-normal">
              WhatsApp:{' '}
              <a
                className="hover:text-white transition-colors underline underline-offset-2"
                href="https://wa.me/919000000000"
                target="_blank"
                rel="noopener noreferrer"
              >
                +91 90000 00000
              </a>
            </p>
          </div>

          {/* Shop Links Col */}
          <div className="md:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-200 mb-4">
              Shop
            </h4>
            <ul className="space-y-2.5 text-xs text-emerald-100/80">
              <li>
                <Link className="hover:text-white transition-colors" to="/shop?category=cat-litter">
                  Cat litter
                </Link>
              </li>
              <li>
                <Link className="hover:text-white transition-colors" to="/shop?category=cats">
                  Cat grooming
                </Link>
              </li>
              <li>
                <Link className="hover:text-white transition-colors" to="/shop?category=dogs">
                  Dog grooming
                </Link>
              </li>
              <li>
                <Link className="hover:text-white transition-colors" to="/account">
                  Subscriptions
                </Link>
              </li>
            </ul>
          </div>

          {/* Help Links Col */}
          <div className="md:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-200 mb-4">
              Help
            </h4>
            <ul className="space-y-2.5 text-xs text-emerald-100/80">
              <li>
                <Link className="hover:text-white transition-colors" to="/order-confirmation">
                  Track order
                </Link>
              </li>
              <li>
                <Link className="hover:text-white transition-colors" to="/cart">
                  Shipping &amp; returns
                </Link>
              </li>
              <li>
                <Link className="hover:text-white transition-colors" to="/#faqs">
                  FAQs
                </Link>
              </li>
              <li>
                <Link className="hover:text-white transition-colors" to="/account">
                  Contact us
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links Col */}
          <div className="md:col-span-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-200 mb-4">
              Company
            </h4>
            <ul className="space-y-2.5 text-xs text-emerald-100/80">
              <li>
                <Link className="hover:text-white transition-colors" to="/our-story">
                  Our story
                </Link>
              </li>
              <li>
                <Link className="hover:text-white transition-colors" to="/shop">
                  Shop all
                </Link>
              </li>
              <li>
                <Link className="hover:text-white transition-colors" to="/login">
                  Account login
                </Link>
              </li>
              <li>
                <Link className="hover:text-white transition-colors" to="/our-story">
                  Made in India
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright Subfoot */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-100/60 gap-4">
          <p>© 2025 The Sniff Co. · Made in India</p>
        </div>
      </div>
    </footer>
  );
};
