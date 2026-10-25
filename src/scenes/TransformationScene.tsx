'use client';

import React from 'react';
import { Layers, ArrowDown } from 'lucide-react';

export function TransformationScene() {
  return (
    <section
      id="transformation"
      className="scene-section scene-transformation dark-scene"
      aria-labelledby="transformation-title"
    >
      <div className="container-editorial">
        <div style={{ maxWidth: '920px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 5 }}>
          <div className="scene-index" style={{ justifyContent: 'center' }}>
            <span>SCENE 02 // THE TRANSFORMATION</span>
          </div>

          <h2
            id="transformation-title"
            className="font-editorial-large"
            style={{
              color: 'var(--color-ivory)',
              marginBottom: '2rem',
              textShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
              lineHeight: 1.05,
            }}
          >
            I Build What Runs
            <br />
            <span style={{ color: 'var(--color-lavender)' }}>Behind the Screen.</span>
          </h2>

          <p
            style={{
              fontSize: 'clamp(1.125rem, 2.2vw, 1.4rem)',
              color: 'var(--color-lavender-soft)',
              maxWidth: '680px',
              margin: '0 auto 2.75rem auto',
              lineHeight: 1.6,
            }}
          >
            Crossing into the engine room. Where distributed queues, atomic mutexes,
            and idempotent pipelines guarantee that critical business logic executes with zero data loss.
          </p>

          {/* Architectural Telemetry Badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem', alignItems: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 20px',
                borderRadius: '9999px',
                border: '1px solid rgba(185, 165, 246, 0.35)',
                background: 'rgba(23, 23, 28, 0.75)',
                backdropFilter: 'blur(12px)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8125rem',
                color: 'var(--color-lavender-soft)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#E26D5C',
                  boxShadow: '0 0 10px #E26D5C',
                }}
              />
              <span>APERTURE EXPANDING // SYSTEM TOPOLOGY ACTIVE</span>
            </div>

            <a
              href="#systems"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '9999px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--color-ivory)',
                textDecoration: 'none',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8125rem',
                transition: 'all 0.2s',
              }}
            >
              <Layers size={14} />
              <span>EXPLORE TOPOLOGY</span>
              <ArrowDown size={14} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
