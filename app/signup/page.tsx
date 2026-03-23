"use client";

import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import React, { useState, useEffect } from "react";
import { useSyncExternalStore } from "react";

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

export default function SignUp() {
  const darkMode = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot
  );
  const [mounted, setMounted] = useState(false);

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

  const handleGoogleSignUp = async () => {
    await signIn("google", { callbackUrl: "/inbox" });
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? "bg-[#0D1117] text-[#F9FAFB]" : "bg-[#FAFBFC] text-[#111827]"}`}>
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl ${darkMode ? "bg-[#0D1117]/95 border-[#30363D]" : "bg-[#FAFBFC]/95 border-[#E5E7EB]"} border-b`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.a 
            href="/"
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
          </motion.a>
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
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="mb-8">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-4">
                Join <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">Ping</span>
              </h1>
              <p className={`text-lg mb-12 ${darkMode ? "text-[#9CA3AF]" : "text-[#6B7280]"}`}>
                Transform your inbox into a conversation
              </p>
            </motion.div>
          </div>

          {mounted && (
            <motion.button
              onClick={handleGoogleSignUp}
              className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 mx-auto border-2 ${
                darkMode
                  ? "bg-[#161B22] border-[#30363D] hover:border-emerald-500 hover:bg-[#0D1117]"
                  : "bg-white border-[#E5E7EB] hover:border-emerald-500 hover:bg-gray-50"
              }`}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  style={{ fill: "#4285F4" }}
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  style={{ fill: "#34A853" }}
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  style={{ fill: "#FBBC05" }}
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  style={{ fill: "#EA4335" }}
                />
              </svg>
              <span>Sign up with Google</span>
            </motion.button>
          )}

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className={`mt-6 text-sm ${darkMode ? "text-[#6B7280]" : "text-[#9CA3AF]"}`}
          >
            Already have an account?{" "}
            <motion.a
              href="#"
              className="text-emerald-500 hover:text-emerald-400 font-semibold underline decoration-2 decoration-transparent hover:decoration-emerald-400 transition-all"
              whileHover={{ scale: 1.05 }}
            >
              Sign in
            </motion.a>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
