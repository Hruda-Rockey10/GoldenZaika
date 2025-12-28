"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin, Github, Linkedin, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-black text-white relative border-t border-white/10 mt-12 pb-12 md:pb-0">
      {/* Decorative Gradient */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-gold to-transparent opacity-50"></div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-4">
          {/* Brand Section */}
          <div className="space-y-6 md:col-span-6 lg:col-span-3">
            <Link
              href="/"
              className="text-2xl font-bold font-sans tracking-wide block"
            >
              <span className="text-primary-gold">Golden</span>
              <span className="text-white">Zaika</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Experience the finest culinary delights delivered straight to your
              doorstep. authentic flavors, premium ingredients, and
              unforgettable taste.
            </p>
            <div className="flex gap-4 pt-2">
              <SocialIcon icon={Mail} href="mailto:hruda.iit.work@gmail.com" />
              <SocialIcon
                icon={Linkedin}
                href="https://www.linkedin.com/in/hruda10/"
              />
              <SocialIcon
                icon={Github}
                href="https://github.com/Hruda-Rockey10"
              />
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-6 lg:col-span-2">
            <h4 className="text-lg font-bold text-white mb-4 border-l-4 border-primary-gold pl-3">
              Company
            </h4>
            <ul className="space-y-2">
              <FooterLink href="/" text="Home" />
              <FooterLink href="/menu" text="Explore Menu" />
              <FooterLink href="/orders" text="My Orders" />
              <FooterLink href="/contact" text="Contact Us" />
            </ul>
          </div>

          {/* Contact Info */}
          <div className="md:col-span-6 lg:col-span-3">
            <h4 className="text-lg font-bold text-white mb-4 border-l-4 border-primary-gold pl-3">
              Contact Us
            </h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-primary-gold mt-1 shrink-0" />
                <span>
                  Ganesh Street, <br />
                  Berhampur, Odisha, India
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-primary-gold shrink-0" />
                <span>+91 7978326 ***</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-primary-gold shrink-0" />
                <span>hruda.iit.work@gmail.com</span>
              </li>
            </ul>
          </div>

          {/* Tech Stack */}
          <div className="md:col-span-6 lg:col-span-4">
            <h4 className="text-lg font-bold text-white mb-4 border-l-4 border-primary-gold pl-3">
              Tech Stack
            </h4>
            <p className="text-gray-400 text-xs mb-3">
              Built with cutting-edge technologies.
            </p>
            <div className="grid grid-cols-3 gap-2">
              <TechBadge
                text="Next.js"
                icon="https://cdn.simpleicons.org/nextdotjs/white"
              />
              <TechBadge
                text="Firebase"
                icon="https://cdn.simpleicons.org/firebase"
              />
              <TechBadge
                text="Tailwind"
                icon="https://cdn.simpleicons.org/tailwindcss"
              />
              <TechBadge text="Zustand" icon="/assets/zustand-bear.png" />
              <TechBadge
                text="Redis"
                icon="https://cdn.simpleicons.org/redis"
              />
              <TechBadge
                text="Gemini AI"
                icon="https://cdn.simpleicons.org/googlegemini"
              />
              <TechBadge
                text="Razorpay"
                icon="https://cdn.simpleicons.org/razorpay"
              />
              <TechBadge
                text="Firestore"
                icon="https://cdn.simpleicons.org/firebase"
              />
              <TechBadge
                text="Storage"
                icon="https://cdn.simpleicons.org/firebase"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Strip */}
      <div className="border-t border-white/10 bg-black/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col items-center gap-2 text-xs text-gray-500">
          <p>© 2025 Golden Zaika. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Created with{" "}
            <Heart
              size={12}
              className="text-red-500 fill-red-500 animate-pulse"
            />{" "}
            by <span className="text-white font-medium">Hrudananda Behera</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

// Sub-components
function SocialIcon({ icon: Icon, href }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-primary-gold hover:text-black transition-all hover:-translate-y-1"
    >
      <Icon size={18} />
    </a>
  );
}

function FooterLink({ href, text }) {
  return (
    <li>
      <Link
        href={href}
        className="text-gray-400 hover:text-primary-gold transition-colors text-sm flex items-center gap-2 group"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-primary-gold transition-colors"></span>
        {text}
      </Link>
    </li>
  );
}

function TechBadge({ text, icon }) {
  return (
    <span className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 hover:border-primary-gold/50 transition-all cursor-default flex items-center justify-start gap-2 group hover:shadow-[0_0_15px_rgba(255,215,0,0.1)] hover:-translate-y-0.5 relative overflow-hidden backdrop-blur-sm whitespace-nowrap">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none"></div>
      {icon && (
        <Image
          src={icon}
          alt={text}
          width={16}
          height={16}
          unoptimized
          className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity"
        />
      )}
      {text}
    </span>
  );
}
