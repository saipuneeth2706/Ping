"use client";

import { motion, useInView, MotionConfig } from "framer-motion";
import { useRef, useState, type ReactNode } from "react";

const EASE: [number, number, number, number] = [0.21, 0.6, 0.35, 1];

function Reveal({
  children,
  delay = 0,
  className = "",
  y = 30,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-70px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.8, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
//
// function Eyebrow({
//   children,
//   className = "",
// }: {
//   children: ReactNode;
//   className?: string;
// }) {
//   return (
//     <p
//       className={`flex items-center gap-2.5 text-sm font-medium tracking-[0.16em] text-mute ${className}`}
//     >
//       <span className="h-1.5 w-1.5 rounded-full bg-accent" />
//       {children}
//     </p>
//   );
// }

function Nav() {
  return (
    <header className="fixed inset-x-0 top-3 z-40 flex justify-center px-4">
      <motion.nav
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="flex w-full max-w-md items-center justify-between rounded-full border border-ink/5 bg-white/70 py-2 pl-2 pr-3 shadow-soft backdrop-blur-xl"
      >
        <a
          href="#top"
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
          href="/signup"
          className="rounded-full bg-ink px-4.5 py-2.5 text-sm font-medium text-canvas shadow-soft transition-colors duration-300 hover:bg-ink/90"
        >
          Sign up
        </a>
      </motion.nav>
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden px-6 pt-36 pb-20 sm:pt-48 sm:pb-28">
      {/* ambient blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -left-40 top-4 h-[26rem] w-[26rem] rounded-full bg-cream opacity-60 blur-3xl"
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-40 top-24 h-[24rem] w-[24rem] rounded-full bg-lavender opacity-60 blur-3xl"
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
        />
      </div>

      <div className="relative mx-auto max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
          className="mb-7 inline-flex items-center gap-2 rounded-full border border-ink/5 bg-white/70 px-4 py-1.5 text-sm text-mute shadow-soft backdrop-blur"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Beta — email, refolded into chats
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.25, ease: EASE }}
          className="text-[2.8rem] leading-[1.05] tracking-[-0.025em] sm:text-6xl lg:text-[4.4rem]"
        >
          Your inbox,{" "}
          <span className="font-script relative inline-block rotate-[-3deg] text-[1.35em] leading-[0.85] text-accent-deep">
            simplified.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: EASE }}
          className="mx-auto mt-7 max-w-[500px] text-lg leading-relaxed text-mute"
        >
          Ping reads your Gmail like a messaging app — every thread becomes a
          chat, so the clutter disappears and the mail that matters is finally
          easy to read.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55, ease: EASE }}
          className="mx-auto mt-10 flex w-full max-w-md flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <a
            href="/signup"
            className="w-full rounded-full bg-accent px-7 py-4 font-medium text-ink shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift sm:w-auto"
          >
            Sign up
          </a>
          <a
            href="#experience"
            className="w-full rounded-full border border-stone-200 bg-white px-7 py-4 font-medium text-ink transition-all duration-300 hover:border-stone-300 hover:bg-stone-50 sm:w-auto"
          >
            See how it feels
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-8 text-sm text-mute/80"
        >
          Free during beta · your Gmail stays exactly yours
        </motion.p>
      </div>
    </section>
  );
}

const MOMENTS = [
  {
    time: "8:00 am",
    text: "Reviewed overnight mail. Two threads need replies.",
    accentHover: "group-hover:text-accent-deep",
    tintHover: "group-hover:bg-accent/25",
  },
  {
    time: "9:30 am",
    text: "Client thread cleared. Reply sent as a chat.",
    accentHover: "group-hover:text-lavender-deep",
    tintHover: "group-hover:bg-lavender/40",
  },
  {
    time: "12:15 pm",
    text: "Quarterly numbers, folded into one conversation.",
    accentHover: "group-hover:text-sage-deep",
    tintHover: "group-hover:bg-sage/40",
  },
  {
    time: "3:45 pm",
    text: "Vendor follow-up done. No mail left open.",
    accentHover: "group-hover:text-accent-deep",
    tintHover: "group-hover:bg-accent/25",
  },
  {
    time: "6:00 pm",
    text: "Newsletters archived. Kept only what mattered.",
    accentHover: "group-hover:text-lavender-deep",
    tintHover: "group-hover:bg-lavender/40",
  },
  {
    time: "9:00 pm",
    text: "No pending threads. Inbox closed for the day.",
    accentHover: "group-hover:text-sage-deep",
    tintHover: "group-hover:bg-sage/40",
  },
];

function DayFlow() {
  return (
    <section id="day" className="scroll-mt-28 px-6 pt-6 pb-20 sm:pb-28">
      <Reveal className="mx-auto max-w-6xl">
        <div className="mb-11">
          {/* <Eyebrow>a day, as chats</Eyebrow> */}
          <h2 className="mt-4 max-w-xl text-4xl tracking-[-0.025em] sm:text-5xl">
            A day when your inbox{" "}
            <span className="font-script text-[0.72em] leading-none text-accent-deep">
              reads like chat.
            </span>
          </h2>
        </div>
      </Reveal>

      <Reveal className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {MOMENTS.map((moment, i) => (
            <motion.article
              key={moment.time}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.7, delay: i * 0.06, ease: EASE }}
              className={`group flex h-full flex-col justify-between overflow-hidden rounded-3xl bg-white p-4 shadow-soft ring-1 ring-ink/5 transition-colors duration-500 sm:p-5 ${moment.tintHover}`}
            >
              <span className="text-xs text-stone-400 sm:text-sm">{moment.time}</span>
              <p
                className={`mt-3 text-sm leading-snug text-ink transition-colors duration-500 sm:mt-4 sm:text-base ${moment.accentHover}`}
              >
                {moment.text}
              </p>
            </motion.article>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

function Phone({
  className,
  screenClassName,
  children,
}: {
  className?: string;
  screenClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <div className="relative rounded-[2.4rem] border-[10px] border-white bg-white shadow-lift ring-1 ring-ink/5">
        <div className="absolute left-1/2 top-3 z-10 h-4 w-16 -translate-x-1/2 rounded-full bg-ink/5" />
        <div
          className={`flex flex-col overflow-hidden rounded-[2rem] ${screenClassName ?? ""}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

const OLD_MAIL = [
  { from: "Amazon", init: "AZ", ring: "bg-stone-800 text-white", subj: "Your order #204-9921 is on the way", time: "9:03", unread: true },
  { from: "Payroll", init: "P", ring: "bg-emerald-300 text-ink", subj: "July payslip is ready", time: "8:47", unread: true },
  { from: "Sahil Patel", init: "SP", ring: "bg-sky-300 text-ink", subj: "shared 'Q3 Metrics.pdf' with you", time: "8:12", unread: true },
  { from: "Studio 99", init: "S9", ring: "bg-stone-200 text-ink", subj: "FINAL SALE — up to 70% off", time: "7:42", unread: false, promo: true },
  { from: "Adam Chen", init: "AC", ring: "bg-violet-300 text-ink", subj: "RE: Q3 numbers (3 replies)", time: "yest", unread: false },
  { from: "Nordstrom", init: "NR", ring: "bg-stone-200 text-ink", subj: "Your wishlist is back in stock", time: "yest", unread: false, promo: true },
  { from: "Team Ops", init: "TO", ring: "bg-rose-300 text-ink", subj: "Can we do a 15-min call?", time: "mon", unread: true },
];

function OldInbox() {
  return (
    <div className="flex h-full flex-col bg-white pt-9 pb-3">
      <div className="flex w-full items-center justify-between px-3 py-1.5">
        <div className="h-8 w-8 rounded-full bg-ink/80" />
        <div className="text-center">
          <p className="text-[12px] font-semibold text-ink">Inbox</p>
          <p className="text-[9px] text-mute">1,241 unread</p>
        </div>
        <div className="flex gap-1.5">
          <span className="h-6 w-6 rounded-full bg-stone-200" />
          <span className="h-6 w-6 rounded-full bg-stone-200" />
        </div>
      </div>

      <div className="px-3 pb-2">
        <div className="flex w-fit items-center rounded-full bg-rose-100/80 px-2.5 py-1 text-[9px] font-medium text-rose-500">
          98 new · mostly offers
        </div>
      </div>

      <div className="min-h-0 flex-1 divide-y divide-stone-100 px-1.5">
        {OLD_MAIL.map((mail) => (
          <div key={mail.from} className="flex items-center gap-2 py-2">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold ${mail.ring}`}
            >
              {mail.init}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={`truncate text-[10px] ${
                  mail.unread ? "font-semibold text-ink" : "text-stone-500"
                }`}
              >
                {mail.subj}
              </p>
              <p className="truncate text-[9px] text-mute/80">{mail.from}</p>
            </div>
            {mail.promo && (
              <span className="shrink-0 rounded bg-rose-100 px-1 py-0.5 text-[7px] font-semibold text-rose-500">
                PROMO
              </span>
            )}
            <span
              className={`shrink-0 text-[9px] ${
                mail.unread ? "text-ink" : "text-stone-400"
              }`}
            >
              {mail.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const CHAT = [
  { from: "in", text: "Hey — the Q3 numbers look off on page 3?", time: "12:03" },
  { from: "out", text: "Just checked — it's totals before netting.", time: "12:04", read: true },
  { from: "in", text: "Got it. Can we sync after lunch?", time: "12:05" },
  { from: "out", text: "Free at 2. Sending the fixed sheet over.", time: "12:06", read: true },
  { from: "in", text: "Perfect, booked. Legend.", time: "12:08" },
];

function PingThreads() {
  return (
    <div className="flex h-full flex-col bg-[#E4EEF7] pt-9 pb-3">
      <div className="flex items-center gap-2 border-b border-ink/5 bg-[#D9E9F6] px-2.5 py-2">
        <svg
          className="h-4 w-4 shrink-0 text-accent-deep"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-300 text-[9px] font-semibold text-ink">
          AC
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-semibold text-ink">Adam Chen</p>
          <p className="truncate text-[8px] text-mute">RE: Q3 numbers · from your inbox</p>
        </div>
        <svg
          className="h-4 w-4 shrink-0 text-accent-deep"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M2 5l3-2 4 5-2 2a14 14 0 006 6l2-2 5 4-2 3a3 3 0 01-3 1C12.8 21.6 2.4 11.2 2 8A3 3 0 012 5z" />
        </svg>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden px-2.5 py-2">
        <div className="mx-auto rounded-full bg-white/80 px-2 py-0.5 text-[8px] font-medium text-mute shadow-sm">
          Today
        </div>
        {CHAT.map((c) => (
          <div
            key={c.text}
            className={`flex max-w-[85%] flex-col ${
              c.from === "out" ? "ml-auto items-end" : "items-start"
            }`}
          >
            <div
              className={`flex items-end gap-1 rounded-2xl px-2.5 py-1.5 shadow-sm ${
                c.from === "out" ? "rounded-tr-sm bg-accent/85" : "rounded-tl-sm bg-white"
              }`}
            >
              <p className="text-[10px] leading-snug text-ink">{c.text}</p>
              <span className="flex shrink-0 items-center gap-0.5 pb-px pl-1 text-[7px] text-mute/70">
                {c.time}
                {c.from === "out" && (
                  <svg
                    className="h-2.5 w-3 text-accent-deep"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2 12l4 4L15 6" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 12l4 4L22 6" />
                  </svg>
                )}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 rounded-2xl bg-white px-2.5 py-2 shadow-sm">
        <span className="flex h-5 w-5 items-center justify-center text-mute/60">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.5a8.5 8.5 0 01-14 6.6L3 20l1.9-4A8.5 8.5 0 1121 11.5z" />
          </svg>
        </span>
        <span className="h-6 flex-1 rounded-full bg-[#F0F4F8]" />
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent">
          <svg
            className="h-3 w-3 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </div>
    </div>
  );
}

function AppPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      id="experience"
      className="relative overflow-hidden scroll-mt-28 px-6 pt-16 pb-24 sm:pb-32"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute left-[12%] top-10 h-72 w-72 rounded-full bg-sage/70 blur-3xl"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-6 right-[10%] h-80 w-80 rounded-full bg-lavender/70 blur-3xl"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      <div className="relative mx-auto max-w-3xl text-center">
        <Reveal>
          {/* <Eyebrow className="justify-center">the app</Eyebrow> */}
          <h2 className="mt-4 text-4xl tracking-[-0.025em] sm:text-5xl">
            From pile to{" "}
            <span className="font-script text-[0.72em] leading-none text-accent-deep">
              conversation.
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-mute">
            Every email you already have, folded into threads that read like
            chats — the signal floats up, the noise stays out of sight.
          </p>
        </Reveal>
      </div>

      <div
        ref={ref}
        aria-hidden
        className="relative mx-auto mt-16 flex max-w-3xl flex-col items-center gap-12 sm:mt-20 sm:flex-row sm:items-center sm:justify-center sm:gap-3"
      >
        <motion.div
          initial={{ opacity: 0, y: 44, scale: 0.97 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.9, delay: 0.05, ease: EASE }}
          className="w-full max-w-[16rem] sm:w-[45%] sm:max-w-72"
        >
          <Phone screenClassName="aspect-[300/620]">
            <OldInbox />
          </Phone>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
          className="flex items-center justify-center"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-soft ring-1 ring-ink/5">
            <svg
              className="h-5 w-5 rotate-90 text-accent-deep sm:rotate-0"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16M13 5l7 7-7 7" />
            </svg>
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 44, scale: 0.97 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
          className="w-full max-w-[16rem] sm:w-[45%] sm:max-w-72"
        >
          <Phone screenClassName="aspect-[300/620] bg-[#EDF6FC]">
            <PingThreads />
          </Phone>
        </motion.div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    n: "01",
    title: "Connect your Gmail",
    line: "Ping sits quietly on top of the Gmail you already have. Nothing moves, nothing is lost, everything stays in sync.",
  },
  {
    n: "02",
    title: "Threads become chats",
    line: "Every conversation refolds into a chat interface — replies in bubbles, in order, exactly like a messaging app.",
  },
  {
    n: "03",
    title: "The pile disappears",
    line: "Newsletters and noise settle out of sight. Only the mail that matters stays in view, easy to read and easy to reply to.",
  },
];

function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-28 px-6 pt-6 pb-20 sm:pb-28">
      <Reveal className="mx-auto max-w-6xl">
        <div className="mb-12 max-w-xl">
          {/* <Eyebrow>how it works</Eyebrow> */}
          <h2 className="mt-4 text-4xl tracking-[-0.025em] sm:text-5xl">
            Email that finally reads like{" "}
            <span className="font-script text-[0.72em] leading-none text-accent-deep">
              messages.
            </span>
          </h2>
        </div>
      </Reveal>

      <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <Reveal key={step.n} delay={i * 0.08} className="h-full">
            <div className="flex h-full flex-col rounded-[2rem] bg-white p-8 shadow-soft ring-1 ring-ink/5 transition-transform duration-500 hover:-translate-y-1">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-sm font-medium text-accent-deep">
                {step.n}
              </span>
              <h3 className="mt-5 text-xl tracking-tight text-ink">{step.title}</h3>
              <p className="mt-2.5 leading-relaxed text-mute">{step.line}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

const FAQS = [
  {
    q: "Does it work with my Gmail?",
    a: "Yes. Ping sits on top of the Gmail you already have. Connect once, and every thread becomes a conversation — starred, sent, drafts, and archived all stay in sync.",
  },
  {
    q: "Is my mail private?",
    a: "Your messages stay in your account. Ping reads the surface of a thread to group it into a chat; it doesn't train on your mail, and nothing is sold or shown to anyone else.",
  },
  {
    q: "What does it cost?",
    a: "It's free during beta. When Ping grows up, it'll carry a very gentle price for people who want the quiet. Gmail itself stays free.",
  },
  {
    q: "Do I have to leave Gmail?",
    a: "Not at all. Think of Ping as a softer way to sit with the same inbox. Gmail stays on your phone, desk, and browser — Ping just reads it more kindly.",
  },
  {
    q: "I have a lot of mail. Will it be okay?",
    a: "That's exactly who this is for. Ping is calm under pressure — old threads fold into tidy conversations, and the overwhelm settles on its own.",
  },
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="relative z-10 scroll-mt-28 px-6 pt-6 pb-20 sm:pb-28"
    >
      <Reveal className="mx-auto max-w-2xl">
        <div className="mb-10 text-center">
          {/* <Eyebrow className="justify-center">the small print</Eyebrow> */}
          <h2 className="mt-4 text-4xl tracking-[-0.025em] sm:text-5xl">
            Asked,{" "}
            <span className="font-script text-[0.72em] leading-none text-accent-deep">
              softly.
            </span>
          </h2>
        </div>
      </Reveal>

      <div className="mx-auto max-w-2xl space-y-3">
        {FAQS.map((item, i) => {
          const isOpen = open === i;
          return (
            <Reveal key={item.q} delay={i * 0.05}>
              <div className="overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-soft">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${i}`}
                  className="flex w-full items-center justify-between gap-4 p-6 text-left"
                >
                  <span className="font-medium text-ink">{item.q}</span>
                  <motion.span
                    aria-hidden
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.4, ease: EASE }}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-50"
                  >
                    <svg
                      className="h-4 w-4 text-mute"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                    </svg>
                  </motion.span>
                </button>
                <motion.div
                  id={`faq-panel-${i}`}
                  role="region"
                  initial={false}
                  animate={{
                    height: isOpen ? "auto" : 0,
                    opacity: isOpen ? 1 : 0,
                  }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className="overflow-hidden"
                >
                  <p className="px-6 pb-6 leading-relaxed text-mute">{item.a}</p>
                </motion.div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

function Waitlist() {
  return (
    <section
      id="signup"
      className="relative scroll-mt-28 px-6 pt-16 pb-24 sm:pb-32"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -left-20 -top-24 h-80 w-80 rounded-full bg-cream opacity-80 blur-[110px]"
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-lavender opacity-80 blur-[110px]"
          animate={{ y: [0, 14, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
        />
        <motion.div
          className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/40 blur-[100px]"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      <div className="relative mx-auto max-w-xl text-center">
        <Reveal>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-ink shadow-lift">
            <span className="h-2.5 w-2.5 rounded-full bg-accent" />
          </div>
          <h2 className="mt-7 text-4xl tracking-[-0.025em] sm:text-5xl">
            From messy to{" "}
            <span className="font-script text-[0.72em] leading-none text-accent-deep">
              messaging.
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-mute">
            Connect your Gmail once. Every email becomes a chat you can
            actually read — and the clutter stays out of sight.
          </p>
        </Reveal>

        <Reveal delay={0.15} className="mx-auto mt-10 flex justify-center">
          <motion.a
            href="/signup"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="inline-flex h-14 items-center justify-center rounded-full bg-ink px-9 font-medium text-canvas shadow-soft"
          >
            Sign up with Gmail
          </motion.a>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="px-6 pb-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 border-t border-ink/5 pt-8 text-sm text-mute sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
          </span>
          <span className="font-medium tracking-tight text-ink">Ping</span>
          <span className="text-mute/70">— made to slow you down</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="/signup" className="transition-colors duration-300 hover:text-ink">
            Log in
          </a>
          <a href="#" className="transition-colors duration-300 hover:text-ink">
            Privacy
          </a>
          <a href="#" className="transition-colors duration-300 hover:text-ink">
            Contact
          </a>
        </div>
        <p className="text-mute/60">© 2026 Ping</p>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen overflow-x-clip bg-canvas text-ink">
        <Nav />
        <main>
          <Hero />
          <DayFlow />
          <AppPreview />
          <HowItWorks />
          <Faq />
          <Waitlist />
        </main>
        <Footer />
        <div aria-hidden className="grain-overlay" />
      </div>
    </MotionConfig>
  );
}
