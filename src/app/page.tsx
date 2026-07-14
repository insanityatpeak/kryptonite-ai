"use client";

import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import AgentShowcaseSection from "@/components/landing/AgentShowcaseSection";
import BandHowSection from "@/components/landing/BandHowSection";
import BandIntegrationSection from "@/components/landing/BandIntegrationSection";
import CustomCursor from "@/components/landing/CustomCursor";
import FooterSection from "@/components/landing/FooterSection";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import IntegrationsSection from "@/components/landing/IntegrationsSection";
import JudgesSection from "@/components/landing/JudgesSection";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LoadingScreen from "@/components/landing/LoadingScreen";
import ParticleCanvas from "@/components/landing/ParticleCanvas";
import SearchGraphSection from "@/components/landing/SearchGraphSection";
import WhyKryptoniteSection from "@/components/landing/WhyKryptoniteSection";

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fallback = window.setTimeout(() => setIsLoading(false), 5000);
    return () => window.clearTimeout(fallback);
  }, []);

  return (
    <div
      className="landing-page"
      style={{ background: "#fff", minHeight: "100dvh", overflowX: "hidden" }}
    >
      <CustomCursor />

      <AnimatePresence>
        {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}
      </AnimatePresence>

      {!isLoading && (
        <>
          <ParticleCanvas />
          <LandingNavbar />
          <main>
            <HeroSection />
            <SearchGraphSection />
            <WhyKryptoniteSection />
            <AgentShowcaseSection />
            <BandHowSection />
            <HowItWorksSection />
            <BandIntegrationSection />
            <JudgesSection />
            <IntegrationsSection />
          </main>
          <FooterSection />
        </>
      )}
    </div>
  );
}
