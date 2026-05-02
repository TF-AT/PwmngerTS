import React, { useState, useEffect } from 'react';
import { LandingNav } from './LandingNav';
import { Hero } from './Hero';
import { Stats } from './Stats';
import { InfoSections } from './InfoSections';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onRegister }) => {
  const [stats, setStats] = useState({ threats: 0, guardians: 0, rating: 0 });

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          if (entry.target.classList.contains('stats-strip')) {
            fetchStatsAndAnimate();
          }
        }
      });
    }, { threshold: 0.1 });

    const elements = document.querySelectorAll('.reveal-on-scroll, .stats-strip');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const fetchStatsAndAnimate = async () => {
    try {
      const res = await fetch("/api/public/stats");
      const data = await res.json();
      animateStats(data.threats, data.users, data.rating);
    } catch (err) {
      // Fallback to defaults if backend is down
      animateStats(1250000, 48000, 99.9);
    }
  };

  const animateStats = (targetThreats: number, targetGuardians: number, targetRating: number) => {
    const duration = 2500;
    const startTime = performance.now();

    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);
      const currentProgress = easeOut(progress);

      setStats({
        threats: Math.floor(currentProgress * targetThreats),
        guardians: Math.floor(currentProgress * targetGuardians),
        rating: Number((currentProgress * targetRating).toFixed(1))
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
          <img src="/logo.svg" alt="PwmngerTS" style={{ height: '40px', marginBottom: '16px' }} />
          <div>Pwmnger<span>TS</span></div>
        </div>
        <div className="footer-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">Technology</a>
          <a href="#compare">Compare</a>
          <a href="https://github.com/okikijesutech/PwmngerTS">Source</a>
        </div>
        <div className="footer-badges">
          <div className="badge-stub">App Store</div>
          <div className="badge-stub">Google Play</div>
        </div>
        <div className="footer-legal">
          <a href="https://github.com/okikijesutech/PwmngerTS/blob/main/PRIVACY_POLICY.md" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="mailto:support@pwmnger.ts">Support</a>
        </div>
        <div className="footer-copy">
          © 2026 PwmngerTS. Secure Zero-Knowledge Storage Global.
          <br />
          <span style={{ display: 'block', marginTop: '8px', color: 'var(--accent-green)', fontWeight: 600, letterSpacing: '0.5px' }}>A PRODUCT OF THE FACTORY</span>
        </div>
      </footer>

      <style>{`
        .landing-container {
          position: relative;
          z-index: 1;
        }

        .stats-strip {
          display: flex;
          justify-content: space-around;
          padding: 100px 10%;
          background: border-box linear-gradient(to right, transparent, rgba(22, 119, 255, 0.03), transparent);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          opacity: 0;
          transition: opacity 1s var(--ease-premium);
        }
        .stats-strip.visible { opacity: 1; }

        .footer-main {
          padding: 100px 10% 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 40px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .footer-logo {
          display: flex;
          flex-direction: column;
          align-items: center;
          font-size: 28px;
          font-weight: 900;
          letter-spacing: -1px;
        }
        .footer-logo span { color: var(--accent-green); }

        .footer-badges {
          display: flex;
          gap: 16px;
          margin: 10px 0;
        }
        .badge-stub {
          padding: 8px 20px;
          background: #111;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
          cursor: not-allowed;
          transition: all 0.3s ease;
        }
        .badge-stub:hover { border-color: var(--primary); color: #fff; }

        .footer-links {
          display: flex;
          gap: 40px;
        }
        .footer-links a {
          color: var(--text-dim);
          text-decoration: none;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        .footer-links a:hover { color: var(--accent-green); }

        .footer-legal {
          display: flex;
          gap: 24px;
          margin-top: -10px;
        }
        .footer-legal a {
          color: var(--text-muted);
          text-decoration: none;
          font-size: 13px;
          transition: color 0.3s ease;
        }
        .footer-legal a:hover { color: #fff; }

        .footer-copy {
          color: var(--text-muted);
          opacity: 0.3;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-top: 20px;
        }

        @media (max-width: 768px) {
          .stats-strip { flex-direction: column; gap: 40px; padding: 60px 10%; }
          .footer-links { flex-direction: column; align-items: center; gap: 20px; }
        }
      `}</style>
    </div>
  );
};
