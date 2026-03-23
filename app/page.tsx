"use client";

import { useEffect, useSyncExternalStore, useState, useRef } from "react";
import { motion, useInView, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";

function getServerSnapshot() {
  return false;
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getClientSnapshot() {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem("ping-dark-mode");
  if (stored !== null) return JSON.parse(stored);
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StaggerContainer({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        visible: { transition: { staggerChildren: 0.15 } },
        hidden: {},
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StaggerItem({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function ScaleIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

import React from "react";

export default function Home() {
  const darkMode = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot
  );
  const [mounted, setMounted] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [footerVisible, setFooterVisible] = useState(false);
  const lastScrollY = useRef(0);
  const { scrollY, scrollYProgress } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const currentScrollY = latest;
    if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
      setHeaderVisible(false);
    } else {
      setHeaderVisible(true);
    }
    lastScrollY.current = currentScrollY;
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    setFooterVisible(latest > 0.95);
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    localStorage.setItem("ping-dark-mode", JSON.stringify(!darkMode));
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? "bg-[#0D1117] text-[#F9FAFB]" : "bg-[#FAFBFC] text-[#111827]"}`}>
      {/* Navigation */}
      <AnimatePresence mode="wait">
        {headerVisible && (
          <motion.nav 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl ${darkMode ? "bg-[#0D1117]/95 border-[#30363D]" : "bg-[#FAFBFC]/95 border-[#E5E7EB]"} border-b`}
          >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <span className="text-xl font-bold">Ping</span>
          </motion.div>
          <div className="flex items-center gap-4">
            <motion.button
              onClick={toggleDarkMode}
              className={`p-2 rounded-xl transition-all duration-300 ${darkMode ? "hover:bg-[#30363D] text-yellow-400" : "hover:bg-[#E5E7EB] text-[#6B7280]"}`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {darkMode ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </motion.button>
            <motion.a 
              href="/signup" 
              className="hidden sm:block px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/25"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Sign Up
            </motion.a>
          </div>
        </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <FadeIn delay={0.1}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-6">
                <motion.span 
                  className="w-2 h-2 rounded-full bg-emerald-500"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                ></motion.span>
                Now in Beta — Join the Waitlist
              </div>
            </FadeIn>
            
            <FadeIn delay={0.2}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
                Your Inbox,{" "}
                <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
                  Reimagined as a Chat.
                </span>
              </h1>
            </FadeIn>
            
            <FadeIn delay={0.3}>
              <p className={`text-lg sm:text-xl mb-8 ${darkMode ? "text-[#9CA3AF]" : "text-[#6B7280]"}`}>
                Ping transforms Email inbox into a fast, intuitive, WhatsApp-style messaging experience. 
                Turn cluttered email threads into clean, continuous chat bubbles.
              </p>
            </FadeIn>
            
            <FadeIn delay={0.4}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.a 
                  href="#waitlist" 
                  className="group px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/25 flex items-center gap-2 text-lg"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Join the Waitlist
                  <motion.svg 
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </motion.svg>
                </motion.a>
                <motion.a 
                  href="#how-it-works" 
                  className={`px-8 py-4 font-semibold rounded-xl transition-all duration-300 flex items-center gap-2 text-lg ${darkMode ? "hover:bg-[#30363D] text-[#F9FAFB]" : "hover:bg-[#E5E7EB] text-[#111827]"}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  See How It Works
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.a>
              </div>
            </FadeIn>
          </div>

          {/* Hero Image Placeholder */}
          <ScaleIn delay={0.5} className="mt-16">
            <div className="relative">
              <motion.div 
                className={`rounded-2xl overflow-hidden shadow-2xl ${darkMode ? "shadow-emerald-500/10" : "shadow-emerald-900/20"}`}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                <div className={`relative ${darkMode ? "bg-[#161B22]" : "bg-white"} border ${darkMode ? "border-[#30363D]" : "border-[#E5E7EB]"} rounded-2xl p-6`}>
                  {/* Mock UI - Transform Animation */}
                  <div className="flex gap-6">
                    {/* Left Side - Gmail (Before) */}
                    <div className="flex-1 rounded-xl overflow-hidden">
                      <div className={`text-xs font-medium px-3 py-2 ${darkMode ? "bg-[#0D1117] text-[#9CA3AF]" : "bg-gray-100 text-gray-500"}`}>
                        Traditional Gmail
                      </div>
                      <div className={`p-4 space-y-3 ${darkMode ? "bg-[#0D1117]" : "bg-gray-50"}`}>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">N</div>
                          <div className="flex-1">
                            <div className="h-2 w-3/4 rounded bg-gray-300 mb-1"></div>
                            <div className="h-2 w-1/2 rounded bg-gray-200"></div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">S</div>
                          <div className="flex-1">
                            <div className="h-2 w-full rounded bg-gray-300 mb-1"></div>
                            <div className="h-2 w-2/3 rounded bg-gray-200"></div>
                          </div>
                        </div>
                        <div className="rounded-lg bg-white border border-gray-200 p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">A</div>
                            <div className="text-xs font-medium text-gray-900">Amazon</div>
                          </div>
                          <div className="h-2 w-full rounded bg-gray-100 mb-1"></div>
                          <div className="h-2 w-5/6 rounded bg-gray-100 mb-1"></div>
                          <div className="h-2 w-4/6 rounded bg-gray-100"></div>
                        </div>
                        <div className="rounded-lg bg-white border border-gray-200 p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs">G</div>
                            <div className="text-xs font-medium text-gray-900">GitHub</div>
                          </div>
                          <div className="h-2 w-full rounded bg-gray-100 mb-1"></div>
                          <div className="h-2 w-3/4 rounded bg-gray-100"></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Center - Arrow */}
                    <div className="flex items-center justify-center">
                      <motion.div 
                        className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center"
                        animate={{ 
                          scale: [1, 1.1, 1],
                          boxShadow: ["0 0 0 0 rgba(16, 185, 129, 0.4)", "0 0 0 10px rgba(16, 185, 129, 0)", "0 0 0 0 rgba(16, 185, 129, 0)"]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </motion.div>
                    </div>

                    {/* Right Side - Ping (After) */}
                    <div className="flex-1 rounded-xl overflow-hidden">
                      <div className="text-xs font-medium px-3 py-2 bg-emerald-500 text-white">
                        Ping Chat View
                      </div>
                      <div className={`p-4 space-y-2 ${darkMode ? "bg-[#0D1117]" : "bg-gray-50"}`}>
                        {/* Chat Bubbles - Single Email Thread (Amazon Order) */}
                        <motion.div 
                          className="flex items-start gap-2"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 }}
                        >
                          <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">A</div>
                          <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-md bg-white border border-gray-200 text-gray-800 text-sm">
                            <span className="text-xs text-gray-400 font-medium">Amazon &lt;ship-confirm@amazon.com&gt;</span><br/>
                            <span className="font-medium text-gray-900">Your order has shipped!</span><br/>
                            Order #123-4567890-9012345 is on its way.
                          </div>
                        </motion.div>
                        <motion.div 
                          className="flex justify-end"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 }}
                        >
                          <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-bl-md bg-emerald-500 text-white text-sm">
                            Great! When will it arrive?
                          </div>
                        </motion.div>
                        <motion.div 
                          className="flex items-start gap-2"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1 }}
                        >
                          <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">A</div>
                          <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-md bg-white border border-gray-200 text-gray-800 text-sm">
                            <span className="text-xs text-gray-400 font-medium">Amazon &lt;ship-confirm@amazon.com&gt;</span><br/>
                            Expected delivery: <span className="font-medium text-gray-900">March 15-17, 2026</span>
                          </div>
                        </motion.div>
                        <motion.div 
                          className="flex justify-end"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1.2 }}
                        >
                          <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-bl-md bg-emerald-500 text-white text-sm">
                            Perfect, thanks!
                          </div>
                        </motion.div>
                        <motion.div 
                          className="flex items-start gap-2"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1.4 }}
                        >
                          <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">A</div>
                          <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-md bg-white border border-gray-200 text-gray-800 text-sm">
                            <span className="text-xs text-gray-400 font-medium">Amazon &lt;delivery@amazon.com&gt;</span><br/>
                            <span className="font-medium text-gray-900">Out for delivery</span><br/>
                            Your package is out for delivery today!
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </ScaleIn>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={`py-24 px-6 ${darkMode ? "bg-[#161B22]" : "bg-white"}`}>
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Why Ping?
              </h2>
              <p className={`text-lg max-w-2xl mx-auto ${darkMode ? "text-[#9CA3AF]" : "text-[#6B7280]"}`}>
                Experience email the way it should be — fast, clean, and conversational.
              </p>
            </div>
          </FadeIn>

          <StaggerContainer className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <StaggerItem>
              <motion.div 
                className={`group p-8 rounded-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${darkMode ? "bg-[#0D1117] border border-[#30363D] hover:border-emerald-500/50" : "bg-[#FAFBFC] border border-[#E5E7EB] hover:border-emerald-200 hover:shadow-lg"}`}
                whileHover={{ y: -8 }}
              >
                <motion.div 
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mb-6"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </motion.div>
                <h3 className="text-xl font-bold mb-3">Conversational View</h3>
                <p className={`${darkMode ? "text-[#9CA3AF]" : "text-[#6B7280]"}`}>
                  Emails are grouped into beautiful chat bubbles, stripping away messy signatures and headers. Finally, a clean inbox.
                </p>
              </motion.div>
            </StaggerItem>

            {/* Feature 2 */}
            <StaggerItem>
              <motion.div 
                className={`group p-8 rounded-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${darkMode ? "bg-[#0D1117] border border-[#30363D] hover:border-emerald-500/50" : "bg-[#FAFBFC] border border-[#E5E7EB] hover:border-emerald-200 hover:shadow-lg"}`}
                whileHover={{ y: -8 }}
              >
                <motion.div 
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center mb-6"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12h10m-5-4v8" />
                  </svg>
                </motion.div>
                <h3 className="text-xl font-bold mb-3">Familiar Shortcuts</h3>
                <p className={`${darkMode ? "text-[#9CA3AF]" : "text-[#6B7280]"}`}>
                  Swipe-to-archive, instant replies, and read receipts. Everything you love about messaging apps, now for email.
                </p>
              </motion.div>
            </StaggerItem>

            {/* Feature 3 */}
            <StaggerItem>
              <motion.div 
                className={`group p-8 rounded-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${darkMode ? "bg-[#0D1117] border border-[#30363D] hover:border-emerald-500/50" : "bg-[#FAFBFC] border border-[#E5E7EB] hover:border-emerald-200 hover:shadow-lg"}`}
                whileHover={{ y: -8 }}
              >
                <motion.div 
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center mb-6"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </motion.div>
                <h3 className="text-xl font-bold mb-3">Zero Learning Curve</h3>
                <p className={`${darkMode ? "text-[#9CA3AF]" : "text-[#6B7280]"}`}>
                  Ping syncs perfectly with your existing Gmail account. No new email address needed — just connect and chat.
                </p>
              </motion.div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                How It Works
              </h2>
              <p className={`text-lg max-w-2xl mx-auto ${darkMode ? "text-[#9CA3AF]" : "text-[#6B7280]"}`}>
                Get started in under 60 seconds. No complicated setup, no jargon.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Row 1 */}
            {/* Box 1 - Gmail Sync (4 cols) */}
            <FadeIn delay={0.1} className="col-span-1 md:col-span-4">
              <motion.div 
                className={`h-full p-6 rounded-3xl ${darkMode ? "bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20" : "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200"}`}
                whileHover={{ y: -4, scale: 1.01 }}
              >
                <div className="flex items-start gap-4">
                  <motion.div 
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shrink-0"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </motion.div>
                  <div className="flex-3">
                    <h3 className="text-xl font-bold mb-2">Gmail Sync</h3>
                    <p className={`text-sm ${darkMode ? "text-[#9CA3AF]" : "text-[#4B5563]"} leading-relaxed mb-3`}>
                      Your emails sync in real-time. Starred, archived, sent, and drafts — everything stays perfectly in sync across all your devices.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className={`text-sm ${darkMode ? "text-[#9CA3AF]" : "text-[#6B7280]"}`}>Real-time sync</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className={`text-sm ${darkMode ? "text-[#9CA3AF]" : "text-[#6B7280]"}`}>All labels</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className={`text-sm ${darkMode ? "text-[#9CA3AF]" : "text-[#6B7280]"}`}>Multi-device</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </FadeIn>

            {/* Box 2 - Thread View (2 cols) */}
            <FadeIn delay={0.2} className="col-span-1 md:col-span-2">
              <motion.div 
                className={`h-full p-6 rounded-3xl ${darkMode ? "bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border border-indigo-500/20" : "bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200"}`}
                whileHover={{ y: -4, scale: 1.01 }}
              >
                <div className="flex items-start gap-4">
                  <motion.div 
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center shrink-0"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">Thread View</h3>
                    <p className={`text-sm ${darkMode ? "text-[#9CA3AF]" : "text-[#4B5563]"} leading-relaxed`}>
                      Emails grouped into conversation threads. Read full context without jumping between messages.
                    </p>
                  </div>
                </div>
              </motion.div>
            </FadeIn>

            {/* Row 2 */}
            {/* Box 3 - Quick Reply (3 cols) */}
            <FadeIn delay={0.3} className="col-span-1 md:col-span-3">
              <motion.div 
                className={`h-full p-6 rounded-3xl ${darkMode ? "bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20" : "bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200"}`}
                whileHover={{ y: -4, scale: 1.01 }}
              >
                <div className="flex items-start gap-4">
                  <motion.div 
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shrink-0"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">Quick Reply</h3>
                    <p className={`text-sm ${darkMode ? "text-[#9CA3AF]" : "text-[#4B5563]"} leading-relaxed`}>
                      Lightning-fast responses with chat-like simplicity. Type and send in seconds.
                    </p>
                  </div>
                </div>
              </motion.div>
            </FadeIn>

            {/* Box 4 - Smart Search (6 cols - spans middle and bottom rows) */}
            <FadeIn delay={0.4} className="col-span-1 md:col-span-6">
              <motion.div 
                className={`h-full p-6 rounded-3xl ${darkMode ? "bg-gradient-to-br from-teal-500/10 to-teal-600/5 border border-teal-500/20" : "bg-gradient-to-br from-teal-50 to-teal-100/50 border border-teal-200"}`}
                whileHover={{ y: -4, scale: 1.01 }}
              >
                <div className="flex items-start gap-4">
                  <motion.div 
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shrink-0"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">Smart Search</h3>
                    <p className={`text-sm ${darkMode ? "text-[#9CA3AF]" : "text-[#4B5563]"} leading-relaxed mb-3`}>
                      Find any email instantly. Filter by sender, date, subject, or content with natural language queries.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                        <span className={`text-sm ${darkMode ? "text-[#9CA3AF]" : "text-[#6B7280]"}`}>Natural language</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                        <span className={`text-sm ${darkMode ? "text-[#9CA3AF]" : "text-[#6B7280]"}`}>Date filters</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                        <span className={`text-sm ${darkMode ? "text-[#9CA3AF]" : "text-[#6B7280]"}`}>Sender search</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="waitlist" className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <ScaleIn>
            <div className={`p-12 rounded-3xl relative overflow-hidden ${darkMode ? "bg-gradient-to-br from-[#161B22] to-[#0D1117] border border-[#30363D]" : "bg-gradient-to-br from-white to-[#FAFBFC] border border-[#E5E7EB]"}`}>
              {/* Background decoration */}
              <motion.div 
                className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <motion.div 
                className="absolute bottom-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 4, repeat: Infinity, delay: 2 }}
              />
              
              <div className="relative z-10">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                  Ready to Transform Your Inbox?
                </h2>
                <p className={`text-lg mb-8 max-w-xl mx-auto ${darkMode ? "text-[#9CA3AF]" : "text-[#6B7280]"}`}>
                  Join thousands of early adopters experiencing the future of email. Sign up now and get early access!
                </p>
                <motion.form 
                  className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <motion.input 
                    type="email" 
                    placeholder="Enter your email" 
                    className={`w-full px-5 py-4 rounded-xl border-2 outline-none transition-all focus:border-emerald-500 ${darkMode ? "bg-[#0D1117] border-[#30363D] text-white placeholder-[#6B7280]" : "bg-white border-[#E5E7EB] text-gray-900 placeholder-gray-400"}`}
                    whileFocus={{ scale: 1.02 }}
                  />
                  <motion.button 
                    type="submit" 
                    className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/25 whitespace-nowrap"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Get Early Access
                  </motion.button>
                </motion.form>
                <p className={`mt-4 text-sm ${darkMode ? "text-[#6B7280]" : "text-gray-400"}`}>
                  No spam, ever. Unsubscribe anytime.
                </p>
              </div>
            </div>
          </ScaleIn>
        </div>
      </section>

      {/* Footer */}
      <AnimatePresence mode="wait">
        {footerVisible && (
      <motion.footer 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`fixed bottom-0 left-0 right-0 z-40 py-4 px-6 border-t backdrop-blur-xl ${darkMode ? "bg-[#0D1117]/95 border-[#30363D]" : "bg-[#FAFBFC]/95 border-[#E5E7EB]"}`}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <span className="text-sm font-bold">Ping</span>
            </motion.div>

            <div className="flex items-center gap-4">
              <motion.a 
                href="#" 
                className={`transition-colors ${darkMode ? "hover:text-emerald-400 text-[#9CA3AF]" : "hover:text-emerald-600 text-[#6B7280]"}`} 
                aria-label="Twitter/X"
                whileHover={{ scale: 1.2 }}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </motion.a>
              <motion.a 
                href="#" 
                className={`transition-colors ${darkMode ? "hover:text-emerald-400 text-[#9CA3AF]" : "hover:text-emerald-600 text-[#6B7280]"}`} 
                aria-label="GitHub"
                whileHover={{ scale: 1.2 }}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </motion.a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
              <motion.a 
                href="#" 
                className={`transition-colors ${darkMode ? "hover:text-emerald-400 text-[#9CA3AF]" : "hover:text-emerald-600 text-[#6B7280]"}`}
                whileHover={{ scale: 1.05 }}
              >
                Privacy Policy
              </motion.a>
              <motion.a 
                href="#" 
                className={`transition-colors ${darkMode ? "hover:text-emerald-400 text-[#9CA3AF]" : "hover:text-emerald-600 text-[#6B7280]"}`}
                whileHover={{ scale: 1.05 }}
              >
                Contact
              </motion.a>
            </div>
          </div>
        </div>
          </motion.footer>
        )}
      </AnimatePresence>
    </div>
  );
}
