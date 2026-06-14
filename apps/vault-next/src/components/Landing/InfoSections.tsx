import React from "react";
import { Button } from "@pwmnger/ui";

interface InfoSectionsProps {
  onRegister: () => void;
}

export const InfoSections: React.FC<InfoSectionsProps> = ({ onRegister }) => {
  return (
    <>
      <section id="how-it-works" className="how-it-works">
        <div className="section-header reveal-on-scroll">
          <h2>
            Security model in <span className="text-gradient">active hardening</span>
          </h2>
          <p>
            The architecture is headed toward a zero-knowledge model, but the
            backlog still includes critical work before production claims are
            appropriate.
          </p>
        </div>

        <div className="workflow-steps">
          <div className="workflow-step reveal-on-scroll">
            <div className="step-num">01</div>
            <div className="step-content">
              <h3>Local key derivation</h3>
              <p>
                Your master password is processed through <strong>Argon2id</strong>{" "}
                so encryption keys can be derived in the client instead of being
                handed to the server.
              </p>
            </div>
          </div>
          <div className="workflow-step reveal-on-scroll reveal-delay-1">
            <div className="step-num">02</div>
            <div className="step-content">
              <h3>Encrypted vault storage</h3>
              <p>
                Vault data is encrypted before storage and sync, while backup,
                session, and extension safety controls continue to be hardened.
              </p>
            </div>
          </div>
          <div className="workflow-step reveal-on-scroll reveal-delay-2">
            <div className="step-num">03</div>
            <div className="step-content">
              <h3>Ongoing product hardening</h3>
              <p>
                Current priority is reducing credential leakage, token abuse,
                unsafe autofill, and backup mistakes before broader release.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="use-cases">
        <div className="section-header reveal-on-scroll">
          <h2>
            Built for security work, <span className="text-gradient">not hype</span>
          </h2>
          <p>
            The frontend now reflects the project status more directly so users
            can make safer decisions.
          </p>
        </div>
        <div className="use-case-grid">
          <div className="use-case-card glass-premium reveal-on-scroll hover-energy">
            <div className="use-case-icon">Extension</div>
            <h3>Browser extension</h3>
            <p>
              Browser support is available, but extension trust boundaries and
              autofill protections remain part of the critical backlog.
            </p>
          </div>

          <div className="use-case-card glass-premium reveal-on-scroll hover-energy reveal-delay-2">
            <div className="use-case-icon">Web</div>
            <h3>Vault dashboard</h3>
            <p>
              The web frontend now favors encrypted backups, clearer warnings,
              and explicit recovery controls over convenience shortcuts.
            </p>
          </div>
        </div>
      </section>

      <section id="compare" className="comparison-section">
        <div className="section-header reveal-on-scroll">
          <h2>
            Current posture at a <span className="text-gradient">glance</span>
          </h2>
          <p>
            What this build can reasonably claim today versus what still needs
            hardening.
          </p>
        </div>
        <div className="table-container reveal-on-scroll">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Area</th>
                <th>Status today</th>
                <th>Next hardening step</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Local encryption</td>
                <td className="yes">Implemented</td>
                <td className="highlight">Continue validating storage and recovery flows</td>
              </tr>
              <tr>
                <td>Encrypted backup UX</td>
                <td className="partial">Improved in frontend</td>
                <td className="highlight">Add broader tests and recovery guidance</td>
              </tr>
              <tr>
                <td>Session and auth hardening</td>
                <td className="partial">In progress</td>
                <td className="highlight">Token hashing, rotation, CSRF, rate limits</td>
              </tr>
              <tr>
                <td>Extension safety</td>
                <td className="no">Not complete</td>
                <td className="highlight">Origin validation and tighter permissions</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="community">
        <div className="community-inner glass-premium reveal-on-scroll hover-energy">
          <div className="community-icon">Open</div>
          <h2>
            Transparency over <span className="text-gradient">overclaiming</span>
          </h2>
          <p>
            Open source helps contributors review the implementation, report
            issues, and follow the hardening roadmap. It does not replace an
            audit, and the product should still be treated as experimental.
          </p>
          <div className="community-links">
            <a
              href="https://github.com/okikijesutech/PwmngerTS"
              target="_blank"
              rel="noopener noreferrer"
              className="github-link"
            >
              View on GitHub
            </a>
            <Button
              variant="secondary"
              onClick={() =>
                window.open(
                  "https://github.com/okikijesutech/PwmngerTS/issues",
                  "_blank",
                  "noopener,noreferrer",
                )
              }
            >
              Report Security Concern
            </Button>
          </div>
        </div>
      </section>

      <section className="faq">
        <div className="faq-grid">
          <div className="faq-item reveal-on-scroll">
            <h3 className="accent-blue">Master password ownership</h3>
            <p>
              The design aims to keep your master password out of server-side
              knowledge, but you should still keep recovery material safe and
              avoid using this build for irreplaceable secrets.
            </p>
          </div>
          <div className="faq-item reveal-on-scroll reveal-delay-1">
            <h3 className="accent-purple">Why the warnings?</h3>
            <p>
              Password managers are high-risk software. The backlog includes
              token hardening, extension boundary checks, safer recovery flows,
              and broader automated tests.
            </p>
          </div>
        </div>
      </section>

      <section id="install" className="install-hub">
        <div className="section-header reveal-on-scroll">
          <h2>
            Try the <span className="text-gradient">prototype</span> carefully
          </h2>
          <p>
            Install locally, test with non-critical accounts, and keep encrypted
            backups under your control.
          </p>
        </div>

        <div className="install-grid">
          <div className="install-card glass-premium reveal-on-scroll">
            <div className="card-tag">Web and desktop</div>
            <div className="card-icon-wrap">
              <div className="card-icon">Ext</div>
            </div>
            <h3>Browser extension</h3>
            <p>
              Use the extension build for development or evaluation only while
              permission tightening and autofill hardening continue.
            </p>

            <div className="install-steps">
              <div className="step">
                <span className="step-count">1</span>
                <p>
                  Download the <code>extension-build.zip</code>
                </p>
              </div>
              <div className="step">
                <span className="step-count">2</span>
                <p>
                  Enable <strong>Developer Mode</strong> in{" "}
                  <code>chrome://extensions</code>
                </p>
              </div>
              <div className="step">
                <span className="step-count">3</span>
                <p>
                  Click <strong>Load unpacked</strong> and select the extracted
                  folder
                </p>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={() => window.open("/extension-build.zip", "_blank")}
            >
              Download ZIP Build
            </Button>
          </div>
        </div>
      </section>

      <section className="final-cta reveal-on-scroll">
        <div className="cta-inner glass-premium">
          <div className="cta-glow"></div>
          <h2>Build with care.</h2>
          <p>
            Explore the vault UX, review the roadmap, and keep usage scoped to
            experimental or low-risk credentials for now.
          </p>
          <Button onClick={onRegister} className="cta-btn">
            Build Your Vault Now
          </Button>
        </div>
      </section>
    </>
  );
};
