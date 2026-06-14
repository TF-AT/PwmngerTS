import React from 'react';
import { Button } from '@pwmnger/ui';

interface LandingNavProps {
  onLogin: () => void;
}

export const LandingNav: React.FC<LandingNavProps> = ({ onLogin }) => {
  return (
    <nav className="landing-nav">
      <div className="nav-logo">
        <img src="/logo.svg" alt="PwmngerTS" className="nav-logo-image" />
        Pwmnger<span>TS</span>
      </div>
      <div className="nav-links">
        <a href="#features">Features</a>
        <a href="#how-it-works">Technology</a>
        <a href="#compare">Compare</a>
        <Button onClick={onLogin} variant="secondary">Unlock Vault</Button>
      </div>
    </nav>
  );
};
