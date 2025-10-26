"use client";

import { SignedOut, SignInButton, SignUpButton, SignedIn, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import React, { useState } from "react";

const Nav: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <nav className="bg-skin-base text-skin-base p-4">
      <div className="flex items-center justify-between">
        {/* Logo - Simplified but still fun */}
        <Link
          href="/"
          className="text-xl sm:text-2xl md:text-3xl font-black tracking-wide hover:scale-105 transition-transform duration-300 group"
        >
          <span className="inline-block group-hover:animate-bounce">🍰</span>
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Tasty
          </span>
          <span className="inline-block group-hover:animate-pulse mx-1">🤖</span>
          <span className="bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
            AI
          </span>
          <span className="inline-block group-hover:animate-bounce mx-1">💹</span>
          <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
            Financial
          </span>
          <span className="ml-2 bg-gradient-to-r from-yellow-400 to-purple-400 bg-clip-text text-transparent">
            Bytes
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/about"
            className="px-4 py-2 font-bold text-lg hover:scale-110 transition-transform hover:bg-gradient-to-r hover:from-pink-400 hover:to-purple-400 hover:bg-clip-text hover:text-transparent"
          >
            👋 About
          </Link>
          
          <SignedOut>
            <SignInButton>
              <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium px-5 py-2 transition">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton>
              <button className="bg-green-600 hover:bg-green-700 text-white rounded-full font-medium px-5 py-2 transition">
                Sign Up
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden w-10 h-10 flex flex-col justify-center items-center gap-1.5"
          aria-label="Toggle menu"
        >
          <span className={`block w-6 h-0.5 bg-current transition-transform ${isOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block w-6 h-0.5 bg-current transition-opacity ${isOpen ? "opacity-0" : ""}`} />
          <span className={`block w-6 h-0.5 bg-current transition-transform ${isOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ${isOpen ? "max-h-64 mt-4" : "max-h-0"}`}>
        <div className="flex flex-col gap-3 py-2">
          <Link
            href="/about"
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 font-bold text-lg text-center hover:bg-gradient-to-r hover:from-pink-400 hover:to-purple-400 hover:bg-clip-text hover:text-transparent"
          >
            👋 About
          </Link>
          
          <SignedOut>
            <SignInButton>
              <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium px-5 py-2 transition w-full">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton>
              <button className="bg-green-600 hover:bg-green-700 text-white rounded-full font-medium px-5 py-2 transition w-full">
                Sign Up
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <div className="flex justify-center py-2">
              <UserButton />
            </div>
          </SignedIn>
        </div>
      </div>
    </nav>
  );
};

export default Nav;