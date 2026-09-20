"use client";

import { motion, MotionConfig } from "framer-motion";
import { signIn } from "next-auth/react";

const EASE: [number, number, number, number] = [0.21, 0.6, 0.35, 1];

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default function SignUp() {
  const handleGoogleSignUp = async () => {
    await signIn("google", { callbackUrl: "/inbox" });
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen overflow-x-clip bg-canvas text-ink">
        <header className="fixed inset-x-0 top-3 z-40 flex justify-center px-4">
          <motion.nav
            initial={{ y: -24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="flex w-full max-w-md items-center justify-between rounded-full border border-ink/5 bg-white/70 py-2 pl-2 pr-3 shadow-soft backdrop-blur-xl"
          >
            <a
              href="/"
              className="flex items-center gap-2.5 rounded-full py-1 pl-1.5 pr-3"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
                <span className="h-2 w-2 rounded-full bg-white" />
              </span>
              <span className="font-medium tracking-tight text-ink">Ping</span>
            </a>
            <span className="hidden items-center gap-1.5 rounded-full border border-ink/5 bg-white/70 px-3 py-1 text-xs font-medium text-mute sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Beta
            </span>
            <a
              href="/"
              className="rounded-full px-3.5 py-1.5 text-sm text-mute transition-colors duration-300 hover:bg-ink/5 hover:text-ink"
            >
              back home
            </a>
          </motion.nav>
        </header>

        <div aria-hidden className="pointer-events-none absolute inset-0">
          <motion.div
            className="absolute -left-24 top-16 h-80 w-80 rounded-full bg-cream opacity-80 blur-[110px]"
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -right-20 bottom-16 h-80 w-80 rounded-full bg-lavender opacity-80 blur-[110px]"
            animate={{ y: [0, 14, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
          />
          <motion.div
            className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/40 blur-[100px]"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
        </div>

        <main className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-32">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
            className="w-full rounded-[2.5rem] bg-white p-8 shadow-soft ring-1 ring-ink/5 sm:p-10"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ink shadow-lift">
              <span className="h-2.5 w-2.5 rounded-full bg-accent" />
            </div>

            <p className="mt-8 flex items-center justify-center gap-2.5 text-sm font-medium tracking-[0.16em] text-mute">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              the sign-in
            </p>
            <h1 className="mt-4 text-center text-4xl tracking-[-0.025em] sm:text-5xl">
              Join the{" "}
              <span className="font-script text-[0.72em] leading-none text-accent-deep">
                chat.
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-sm text-center text-lg leading-relaxed text-mute">
              Sign in with Google and Ping folds every email thread into a
              message — clutter out of sight, people in view.
            </p>

            <motion.button
              onClick={handleGoogleSignUp}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="mt-9 flex w-full items-center justify-center gap-3 rounded-full border border-ink/10 bg-white px-7 py-4 font-medium text-ink shadow-soft transition-colors duration-300 hover:bg-stone-50"
            >
              <GoogleIcon />
              Sign up with Google
            </motion.button>

            <p className="mt-4 text-center text-sm text-mute/70">
              Free during beta · your Gmail stays exactly yours
            </p>

            {/* <p className="mt-6 text-center text-sm text-mute"> */}
            {/*   Already have an account?{" "} */}
            {/*   <a href="#" className="font-medium text-accent-deep transition-colors duration-300 hover:text-ink"> */}
            {/*     Sign in */}
            {/*   </a> */}
            {/* </p> */}
          </motion.div>

          <p className="mt-10 text-center text-xs text-mute/60">
            © 2026 Ping — from your Gmail, with less clutter
          </p>
        </main>

        <div aria-hidden className="grain-overlay" />
      </div>
    </MotionConfig>
  );
}
