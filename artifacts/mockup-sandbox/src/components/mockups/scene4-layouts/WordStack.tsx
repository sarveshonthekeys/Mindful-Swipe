import { useEffect, useState } from "react";

const words = ["What", "if", "every", "swipe", "made", "you", "better?"];

export function WordStack() {
  const [visible, setVisible] = useState<number[]>([]);

  useEffect(() => {
    words.forEach((_, i) => {
      const t = setTimeout(
        () => setVisible((v) => [...v, i]),
        300 + i * 180
      );
      return () => clearTimeout(t);
    });
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.15em",
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        overflow: "hidden",
      }}
    >
      {words.map((word, i) => (
        <div
          key={word}
          style={{
            fontSize: "clamp(3rem, 11vw, 7rem)",
            fontWeight: 400,
            color: "#fff",
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
            opacity: visible.includes(i) ? 1 : 0,
            transform: visible.includes(i) ? "translateY(0)" : "translateY(14px)",
            transition: "opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          {word}
        </div>
      ))}
    </div>
  );
}
