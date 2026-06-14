import React, { useEffect, useState } from "react";
import { LandingNav } from "./LandingNav";
import { Hero } from "./Hero";
import { Stats } from "./Stats";
import { InfoSections } from "./InfoSections";

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLogin,
  onRegister,
}) => {
  const [stats, setStats] = useState({ threats: 0, guardians: 0, rating: 0 });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            if (entry.target.classList.contains("stats-strip")) {
              void fetchStatsAndAnimate();
            }
          }
        });
      },
      { threshold: 0.1 },
    );

    const elements = document.querySelectorAll(
      ".reveal-on-scroll, .stats-strip",
    );
    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  const fetchStatsAndAnimate = async () => {
    try {
      const response = await fetch("/api/public/stats");
      const data = await response.json();
      animateStats(data.threats, data.users, data.rating);
    } catch {
      animateStats(1250000, 48000, 99.9);
    }
  };

  const animateStats = (
    targetThreats: number,
    targetGuardians: number,
    targetRating: number,
  ) => {
    const duration = 2500;
    const startTime = performance.now();

    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = (value: number) => 1 - Math.pow(1 - value, 4);
      const currentProgress = easeOut(progress);

      setStats({
        threats: Math.floor(currentProgress * targetThreats),
        guardians: Math.floor(currentProgress * targetGuardians),
        rating: Number((currentProgress * targetRating).toFixed(1)),
      });

      if (progress < 1) requestAnimationFrame(update);
    };

    requestAnimationFrame(update);
  };

  return (
    <div className="landing-container">
      <LandingNav onLogin={onLogin} />
      <Hero onRegister={onRegister} />
      <Stats {...stats} />
      <InfoSections onRegister={onRegister} />

      <footer className="footer-main">
        <div className="footer-logo">
          <img src="/logo.svg" alt="PwmngerTS" className="footer-logo-image" />
          <div>
            Pwmnger<span>TS</span>
          </div>
        </div>
        <div className="footer-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">Security Notes</a>
          <a href="#compare">Status</a>
          <a
            href="https://github.com/TF-AT/PwmngerTS"
            target="_blank"
            rel="noopener noreferrer"
          >
            Source
          </a>
        </div>
        <div className="footer-badges">
          <div className="badge-stub">App Store</div>
          <div className="badge-stub">Google Play</div>
        </div>
        <div className="footer-legal">
          <a
            href="https://github.com/TF-AT/PwmngerTS/blob/main/PRIVACY_POLICY.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy Policy
          </a>
          <a href="#">Terms of Service</a>
          <a href="mailto:support@pwmnger.ts">Support</a>
        </div>
        <div className="footer-warning">
          PwmngerTS is currently experimental and unaudited. Avoid storing
          high-value production credentials until the critical security backlog
          is complete.
        </div>
        <div className="footer-copy">
          Copyright 2026 PwmngerTS. Open-source password manager prototype.
          <br />
          <span className="footer-copy-note">
            Built in public while security hardening continues.
          </span>
        </div>
      </footer>
    </div>
  );
};
