import { useEffect, useState } from "react";

export function SplitWeight() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 300);
    const t2 = setTimeout(() => setPhase(2), 900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: "#000",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        overflow: "hidden",
        padding: "0 8%",
        boxSizing: "border-box",
        gap: 0,
      }}
    >
      {/* Small, dim preamble */}
      <div
        style={{
          fontSize: "clamp(1rem, 3.8vw, 2.4rem)",
          fontWeight: 300,
          color: "rgba(255,255,255,0.38)",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          textAlign: "center",
          marginBottom: "0.6em",
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 1s ease, transform 1s ease",
        }}
      >
        What if
      </div>

      {/* Medium middle line */}
      <div
        style={{
          fontSize: "clamp(2.2rem, 8.5vw, 5.2rem)",
          fontWeight: 400,
          color: "rgba(255,255,255,0.72)",
          letterSpacing: "-0.02em",
          lineHeight: 1.05,
          textAlign: "center",
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 1s ease 0.1s, transform 1s ease 0.1s",
        }}
      >
        every swipe
      </div>

      {/* Medium middle line 2 */}
      <div
        style={{
          fontSize: "clamp(2.2rem, 8.5vw, 5.2rem)",
          fontWeight: 400,
          color: "rgba(255,255,255,0.72)",
          letterSpacing: "-0.02em",
          lineHeight: 1.05,
          textAlign: "center",
          marginBottom: "0.15em",
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 1s ease 0.2s, transform 1s ease 0.2s",
        }}
      >
        made you
      </div>

      {/* Dominant word */}
      <div
        style={{
          fontSize: "clamp(4rem, 18vw, 11rem)",
          fontWeight: 500,
          color: "#fff",
          letterSpacing: "-0.04em",
          lineHeight: 0.95,
          textAlign: "center",
          opacity: phase >= 2 ? 1 : 0,
          transform: phase >= 2 ? "scale(1) translateY(0)" : "scale(0.88) translateY(20px)",
          transition: "opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        better?
      </div>
    </div>
  );
}
