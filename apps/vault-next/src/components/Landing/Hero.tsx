import React from "react";
import { Button } from "@pwmnger/ui";

interface HeroProps {
  onRegister: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onRegister }) => {
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });

  const handleMouseMove = (event: React.MouseEvent) => {
    const { clientX, clientY } = event;
    const moveX = (clientX - window.innerWidth / 2) / 60;
    const moveY = (clientY - window.innerHeight / 2) / 60;
    setMousePos({ x: moveX, y: moveY });
  };

  return (
    <header className="hero" onMouseMove={handleMouseMove}>
      <div className="hero-content reveal-on-scroll">
        <div className="hero-badge">Experimental and unaudited security preview</div>
        <h1>
          Privacy-first vaulting with a{" "}
          <span className="text-gradient">zero-knowledge direction</span>
        </h1>
        <p>
          PwmngerTS is an open-source password manager prototype built around
          local encryption and modern TypeScript tooling. The security hardening
          backlog is still in progress, so this build should be treated as
          experimental.
        </p>
        <div className="hero-actions">
          <Button onClick={onRegister} className="hero-cta">
            Start Your Vault
          </Button>
          <button
            className="outline-btn"
            onClick={() =>
              document
                .getElementById("how-it-works")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Review Security Notes
          </button>
        </div>
        <div className="download-actions">
          <a href="#install" className="download-link glass-pill">
            <span className="icon" aria-hidden="true">
              Extension
            </span>
            <span>Get Browser Extension</span>
          </a>
        </div>
      </div>
      <div
        className="hero-visual"
        style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }}
      >
        <div className="glass-shield">
          <div className="shield-ring"></div>
          <div className="shield-ring"></div>
          <div className="shield-core" aria-hidden="true">
            Lock
          </div>
          <div className="shield-glow"></div>
        </div>
      </div>
    </header>
  );
};
