import React from 'react';

interface StatsProps {
  threats: number;
  guardians: number;
  rating: number;
}

export const Stats: React.FC<StatsProps> = ({ threats, guardians, rating }) => {
  return (
    <section className="stats-strip">
      <div className="stat-item reveal-on-scroll">
        <h3 className="text-gradient">{(threats / 1000000).toFixed(1)}M+</h3>
        <p>Threats Defused</p>
      </div>
      <div className="stat-item reveal-on-scroll reveal-delay-1">
        <h3 className="text-gradient">{(guardians / 1000).toFixed(0)}k+</h3>
        <p>Active Users</p>
      </div>
      <div className="stat-item reveal-on-scroll reveal-delay-2">
        <h3 className="text-gradient">{rating}%</h3>
        <p>Security Audit</p>
      </div>
    </section>
  );
};
