import React from "react";
import PageLoader from "../../Components/PageLoader/PageLoader";
import Hero from "../../Components/Hero/Hero";
import FeatureBand from "../../Components/FeatureBand/FeatureBand";
import MetricsStrip from "../../Components/MetricsStrip/MetricsStrip";
import EvalSection from "../../Components/EvalSection/EvalSection";
import LiveGame from "../../Components/LiveGame/LiveGame";
import Rankings from "../../Components/Rankings/Rankings";
import RecruiterCTA from "../../Components/RecruiterCTA/RecruiterCTA";

export default function Home({ onOpenSandbox }) {
  return (
    <>
      {/* Intro Telemetry Loader (Counts 000 -> 100 and slides up like Lumora) */}
      <PageLoader />

      {/* Hero with Interactive Canvas, Typographic Watermark & Showcase Card */}
      <Hero onOpenSandbox={onOpenSandbox} />

      {/* 4-Pill Architectural Band */}
      <FeatureBand />

      {/* Scroll-Driven Grandmaster Telemetry Metrics */}
      <MetricsStrip />

      {/* Interactive Telemetry Workstation Preview */}
      <EvalSection />

      {/* Live Grandmaster Arena TV Streams */}
      <LiveGame />

      {/* World Grandmaster Leaderboard */}
      <Rankings />

      {/* High-Impact Recruiter Fast-Track Banner */}
      <RecruiterCTA onOpenSandbox={onOpenSandbox} />
    </>
  );
}
