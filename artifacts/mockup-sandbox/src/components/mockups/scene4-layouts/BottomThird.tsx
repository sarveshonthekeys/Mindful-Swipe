import { useEffect, useState } from "react";

const lines = ["What if every", "swipe made", "you better?"];

export function BottomThird() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 400);
    return () => { clearTimeout(t1); };
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: "#000",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: "0 7% 14%",
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* thin horizontal rule */}
      <div
        style={{
          width: phase >= 1 ? "40%" : "0%",
          height: "1px",
          background: "rgba(255,255,255,0.35)",
          marginBottom: "1.4rem",
          transition: "width 1.2s cubic-bezier(0.16,1,0.3,1)",
        }}
      />

      {lines.map((line, i) => (
        <div
          key={line}
          style={{
            fontSize: "clamp(2.6rem, 9.5vw, 6rem)",
            fontWeight: 400,
            color: "#fff",
            letterSpacing: "-0.025em",
            lineHeight: 1.1,
            textAlign: "left",
            opacity: phase >= 1 ? 1 : 0,
            transform: phase >= 1 ? "translateY(0)" : "translateY(24px)",
            transition: `opacity 1s cubic-bezier(0.16,1,0.3,1) ${i * 0.12}s, transform 1s cubic-bezier(0.16,1,0.3,1) ${i * 0.12}s`,
          }}
        >
          {line}
        </div>
      ))}
    </div>
  );
}
