"use client";

// import { signIn } from "next-auth/react";
import { SignedOut, SignInButton, SignUpButton, SignedIn, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import React, { useState } from "react";


const Nav: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <div className="flex items-center justify-between p-4 flex-wrap bg-skin-base text-skin-base">
      {/* Logo */}
      <Link
        href="/"
        className="text-2xl font-black font-palette-blueslate tracking-wide transform hover:scale-105 transition-transform duration-200"
      >
        <div className="flex flex-wrap items-center justify-center space-x-1 text-2xl sm:text-3xl md:text-4xl">
  <span className="inline-block animate-pulse">T</span>
  <span className="inline-block transform -rotate-2">a</span>
  <span className="inline-block transform rotate-1">s</span>
  <span className="inline-block">t</span>
  <span className="inline-block transform -rotate-1">y</span>
  <span className="mx-2">🍰</span>

  <span className="inline-block transform rotate-2">A</span>
  <span className="inline-block">I</span>
  <span className="mx-2">🤖</span>

  <span className="inline-block transform -rotate-1">F</span>
  <span className="inline-block transform rotate-1">i</span>
  <span className="inline-block">n</span>
  <span className="inline-block transform -rotate-2">a</span>
  <span className="inline-block transform rotate-2">n</span>
  <span className="inline-block">c</span>
  <span className="inline-block transform -rotate-1">i</span>
  <span className="inline-block">a</span>
  <span className="inline-block transform rotate-1">l</span>
  <span className="mx-2">💹</span>

  <span className="text-3xl sm:text-4xl font-black transform rotate-3 inline-block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
    B
  </span>
  <span className="text-3xl sm:text-4xl font-black transform -rotate-2 inline-block bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
    y
  </span>
  <span className="text-3xl sm:text-4xl font-black transform rotate-1 inline-block bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
    t
  </span>
  <span className="text-3xl sm:text-4xl font-black transform -rotate-3 inline-block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
    e
  </span>
  <span className="text-3xl sm:text-4xl font-black transform rotate-2 inline-block bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
    s
  </span>
</div>

      </Link>

      {/* Burger Menu */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex flex-col cursor-pointer w-8 h-8 justify-around items-center md:hidden"
      >
        <span
          className={`block w-8 h-[3px] bg-current transition-transform ${
            isOpen ? "rotate-45 translate-y-2" : ""
          }`}
        ></span>
        <span
          className={`block w-8 h-[3px] bg-current transition-opacity ${
            isOpen ? "opacity-0" : ""
          }`}
        ></span>
        <span
          className={`block w-8 h-[3px] bg-current transition-transform ${
            isOpen ? "-rotate-45 -translate-y-2" : ""
          }`}
        ></span>
      </div>

      {/* Navigation Links + SignIn */}
      <div
        className={`flex flex-col items-center justify-between w-full mt-4 transition-all duration-300 ease-in-out md:flex md:flex-row md:mt-0 md:w-auto md:max-h-none md:overflow-visible ${
          isOpen
            ? "max-h-screen"
            : "max-h-0 overflow-hidden md:max-h-none md:overflow-visible"
        }`}
      >
        {/* AI Articles */}
        {/* <Link
          href="/ai-articles"
          className="py-2 px-4 text-center text-current text-lg font-bold transform hover:scale-110 hover:rotate-1 transition-all duration-200 hover:bg-gradient-to-r hover:from-cyan-400 hover:to-blue-400 hover:bg-clip-text hover:text-transparent group"
        >
          <span className="inline-block group-hover:animate-bounce">🤖</span>
          <span className="inline-block transform group-hover:rotate-1 ml-1">
            A
          </span>
          <span className="inline-block transform group-hover:-rotate-1">
            I
          </span>
          <span className="mx-1">•</span>
          <span className="inline-block transform group-hover:rotate-2">
            A
          </span>
          <span className="inline-block transform group-hover:-rotate-1">
            r
          </span>
          <span className="inline-block transform group-hover:rotate-1">
            t
          </span>
          <span className="inline-block transform group-hover:-rotate-2">
            i
          </span>
          <span className="inline-block transform group-hover:rotate-1">
            c
          </span>
          <span className="inline-block transform group-hover:-rotate-1">
            l
          </span>
          <span className="inline-block transform group-hover:rotate-2">
            e
          </span>
          <span className="inline-block transform group-hover:-rotate-1">
            s
          </span>
        </Link> */}

        {/* About */}
        <Link
          href="/about"
          className="py-2 px-4 text-center text-current text-lg font-bold transform hover:scale-110 hover:-rotate-1 transition-all duration-200 hover:bg-gradient-to-r hover:from-pink-400 hover:to-purple-400 hover:bg-clip-text hover:text-transparent group"
        >
          <span className="inline-block group-hover:animate-pulse">👋</span>
          <span className="inline-block transform group-hover:-rotate-2 ml-1">
            A
          </span>
          <span className="inline-block transform group-hover:rotate-1">
            b
          </span>
          <span className="inline-block transform group-hover:-rotate-1">
            o
          </span>
          <span className="inline-block transform group-hover:rotate-2">
            u
          </span>
          <span className="inline-block transform group-hover:-rotate-1">
            t
          </span>
        </Link>

        {/* Sign in Button */}
        <SignedOut>
               <SignInButton>
                 <button className="bg-blue-600 text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer hover:bg-blue-700 transition">
                   Sign In
                 </button>
               </SignInButton>
               <SignUpButton>
                 <button className="bg-green-600 text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer hover:bg-green-700 transition">
                   Sign Up
                 </button>
               </SignUpButton>
             </SignedOut>
             <SignedIn>
               <UserButton />
             </SignedIn>
      </div>
    </div>
  );
};

export default Nav;
