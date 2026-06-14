"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { commercialStats, trustClients } from "@/lib/data";
import { QuoteTrigger } from "@/components/quote/QuoteTrigger";
import { Container } from "@/components/ui/Container";

function LightSource({
  className,
  color,
  size = "lg",
  delay = 0,
}: {
  className?: string;
  color: "pink" | "purple" | "blue";
  size?: "sm" | "md" | "lg" | "xl";
  delay?: number;
}) {
  const colors = {
    pink: "bg-neon-pink/40",
    purple: "bg-neon-purple/35",
    blue: "bg-neon-blue/30",
  };
  const sizes = {
    sm: "h-48 w-48 blur-[80px]",
    md: "h-64 w-64 blur-[90px]",
    lg: "h-96 w-96 blur-[110px]",
    xl: "h-[32rem] w-[32rem] blur-[130px]",
  };

  return (
    <motion.div
      className={`absolute rounded-full ${colors[color]} ${sizes[size]} ${className}`}
      animate={{
        scale: [1, 1.2, 1.05, 1.15, 1],
        opacity: [0.35, 0.65, 0.45, 0.7, 0.35],
      }}
      transition={{
        duration: 12,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
    />
  );
}

function NeonBeam({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute h-[200%] w-32 bg-gradient-to-b from-transparent via-neon-pink/8 to-transparent ${className}`}
      style={{ transform: "rotate(-15deg)" }}
      animate={{ x: ["-100%", "300%"] }}
      transition={{
        duration: 8,
        repeat: Infinity,
        delay,
        ease: "linear",
        repeatDelay: 4,
      }}
    />
  );
}

function NeonSignPreview() {
  return (
    <motion.div
      className="relative mx-auto w-full max-w-xl"
      initial={{ opacity: 0, scale: 0.92, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 1.1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Outer glow ring */}
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-neon-pink/20 via-neon-purple/10 to-neon-blue/20 blur-2xl animate-pulse-glow" />

      <div className="relative overflow-hidden rounded-2xl border border-white/15 glass-premium shadow-[0_32px_64px_rgba(0,0,0,0.5)]">
        {/* Layer 1: Environment */}
        <div
          className="relative aspect-[4/3]"
          style={{
            background:
              "linear-gradient(180deg, #0a0010 0%, #050505 60%, #0d0015 100%)",
          }}
        >
          {/* Ambient room lighting */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(255,45,149,0.12)_0%,transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(56,189,248,0.08)_0%,transparent_50%)]" />

          {/* Simulated wall texture */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* Neon sign glow on wall */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="absolute -inset-16 rounded-full bg-neon-pink/20 blur-3xl animate-pulse-glow" />
              <div className="absolute -inset-8 rounded-full bg-neon-purple/15 blur-2xl" />
              <motion.div
                className="relative text-center animate-neon-flicker"
                animate={{ opacity: [0.85, 1, 0.92, 1, 0.88, 1] }}
                transition={{ duration: 5, repeat: Infinity }}
              >
                <p
                  className="font-display text-5xl font-bold tracking-[0.15em] sm:text-6xl"
                  style={{
                    color: "#FF2D95",
                    textShadow:
                      "0 0 10px #FF2D95, 0 0 30px rgba(255,45,149,0.8), 0 0 60px rgba(255,45,149,0.4), 0 0 100px rgba(255,45,149,0.2)",
                  }}
                >
                  NEON
                </p>
                <p
                  className="mt-1 font-display text-4xl font-light tracking-[0.35em] sm:text-5xl"
                  style={{
                    color: "#A855F7",
                    textShadow:
                      "0 0 10px #A855F7, 0 0 30px rgba(168,85,247,0.8), 0 0 60px rgba(168,85,247,0.4)",
                  }}
                >
                  BRIGHT
                </p>
              </motion.div>
            </div>
          </div>

          {/* Floor reflection */}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-neon-pink/5 via-neon-purple/3 to-transparent" />

          {/* Vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.5)_100%)]" />
        </div>

        {/* Frame accents */}
        <div className="absolute top-5 left-5 h-10 w-10 border-t-2 border-l-2 border-neon-pink/50" />
        <div className="absolute top-5 right-5 h-10 w-10 border-t-2 border-r-2 border-neon-purple/50" />
        <div className="absolute bottom-5 left-5 h-10 w-10 border-b-2 border-l-2 border-neon-blue/50" />
        <div className="absolute bottom-5 right-5 h-10 w-10 border-b-2 border-r-2 border-neon-pink/50" />
      </div>

      {/* Floating badges */}
      <motion.div
        className="absolute -right-2 top-6 glass-premium rounded-xl px-4 py-3 sm:-right-6"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <p className="text-[10px] uppercase tracking-widest text-muted">
          Commercial Grade
        </p>
        <p className="text-sm font-semibold text-neon-blue">IP65 Rated LED</p>
      </motion.div>

      <motion.div
        className="absolute -left-2 bottom-10 glass-premium rounded-xl px-4 py-3 sm:-left-6"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      >
        <p className="text-[10px] uppercase tracking-widest text-muted">
          Global Delivery
        </p>
        <p className="text-sm font-semibold">Morocco → Worldwide</p>
      </motion.div>

      <motion.div
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 glass-premium rounded-full px-5 py-2"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      >
        <p className="text-xs font-medium whitespace-nowrap">
          <span className="text-neon-pink">12m</span> max installation width
        </p>
      </motion.div>
    </motion.div>
  );
}

const headlineWords = ["Transform", "Your", "Brand"];

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.97]);
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  return (
    <section
      ref={ref}
      className="noise-overlay relative flex min-h-screen items-center overflow-hidden pt-28 pb-20"
    >
      {/* Layered background atmosphere */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{ y: bgY }}
      >
        <LightSource className="-top-20 -left-40 animate-drift" color="pink" size="xl" />
        <LightSource className="top-1/4 -right-32 animate-drift-reverse" color="purple" size="lg" delay={3} />
        <LightSource className="bottom-0 left-1/4 animate-drift" color="blue" size="md" delay={6} />
        <LightSource className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" color="purple" size="sm" delay={2} />

        {/* Neon beams */}
        <NeonBeam className="top-0 left-1/4" delay={0} />
        <NeonBeam className="top-0 right-1/3" delay={3} />

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Radial vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,transparent_0%,#050505_75%)]" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </motion.div>

      <Container className="relative z-10">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
          <motion.div style={{ y, opacity, scale }}>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="inline-flex items-center gap-2.5 rounded-full glass-premium px-5 py-2 text-xs font-medium tracking-wide">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inset-0 rounded-full bg-neon-pink animate-pulse-glow" />
                  <span className="relative rounded-full bg-neon-pink h-2 w-2" />
                </span>
                Commercial LED Neon · Morocco & International
              </span>
            </motion.div>

            {/* Headline — word stagger */}
            <h1 className="mt-8 font-display font-bold leading-[0.95] tracking-tight hero-headline-glow">
              <span className="block overflow-hidden">
                {headlineWords.map((word, i) => (
                  <motion.span
                    key={word}
                    className="inline-block text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] xl:text-[6.5rem] mr-[0.2em]"
                    initial={{ opacity: 0, y: 80 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.9,
                      delay: 0.15 + i * 0.08,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    {word}
                  </motion.span>
                ))}
              </span>
              <motion.span
                className="mt-1 block text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] xl:text-[6.5rem] neon-text-gradient"
                initial={{ opacity: 0, y: 80, filter: "blur(12px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  duration: 1,
                  delay: 0.45,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                Into Light.
              </motion.span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 max-w-lg text-lg leading-relaxed text-muted sm:text-xl"
            >
              Premium custom LED neon signs for hotels, retail chains, and
              corporate brands that demand{" "}
              <span className="text-white/80">world-class visibility.</span>
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center"
            >
              <QuoteTrigger size="lg">
                Get Instant Quote
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </QuoteTrigger>
              <QuoteTrigger step={2} variant="secondary" size="lg">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload Your Logo
              </QuoteTrigger>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.85 }}
              className="mt-4 text-xs text-muted/70"
            >
              Free mockup · 24h response · No commitment required
            </motion.p>

            {/* Commercial stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.8 }}
              className="mt-14 grid grid-cols-2 gap-6 border-t border-white/10 pt-10 sm:grid-cols-4 sm:gap-8"
            >
              {commercialStats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 + i * 0.08 }}
                >
                  <p className="font-display text-2xl font-bold sm:text-3xl">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-muted sm:text-sm">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <NeonSignPreview />
        </div>

        {/* Trust strip */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mt-20 border-t border-white/10 pt-10"
        >
          <p className="text-center text-xs uppercase tracking-[0.25em] text-muted/60">
            Trusted by hospitality groups & global brands
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {trustClients.map((client) => (
              <span
                key={client}
                className="font-display text-sm font-medium tracking-wider text-white/25 transition-colors duration-300 hover:text-white/50 sm:text-base"
              >
                {client}
              </span>
            ))}
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
