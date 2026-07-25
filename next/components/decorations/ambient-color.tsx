import React from "react";

export const AmbientColor = () => {
  return (
    <div className="absolute top-0 left-0 w-screen h-screen z-40 pointer-events-none">
      {/* Beam 1: The Main "Afyascope Cyan" Glow */}
      <div
        style={{
          transform: "translateY(-350px) rotate(-45deg)",
          width: "560px",
          height: "1380px",
          background:
            /* Hue 182 matches your Lightblack/Cyan brand color (#00C2CB) */
            "radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(182, 100%, 70%, .1) 0, hsla(182, 100%, 55%, .05) 50%, hsla(182, 100%, 45%, 0) 80%)",
        }}
        className="absolute top-0 left-0"
      />

      {/* Beam 2: A Subtle "Clinical White/Blue" for Depth */}
      <div
        style={{
          transform: "rotate(-45deg) translate(5%, -50%)",
          transformOrigin: "top left",
          width: "240px",
          height: "1380px",
          background:
            /* Kept closer to Blue (210) to blend with the Navy background */
            "radial-gradient(50% 50% at 50% 50%, hsla(210, 100%, 85%, .06) 0, hsla(210, 100%, 55%, .02) 80%, transparent 100%)",
        }}
        className="absolute top-0 left-0"
      />

      {/* Beam 3: Secondary Cyan Highlight */}
      <div
        style={{
          position: "absolute",
          borderRadius: "20px",
          transform: "rotate(-45deg) translate(-180%, -70%)",
          transformOrigin: "top left",
          top: 0,
          left: 0,
          width: "240px",
          height: "1380px",
          background:
            /* Matches Beam 1 to unify the lighting effect */
            "radial-gradient(50% 50% at 50% 50%, hsla(182, 100%, 85%, .04) 0, hsla(182, 100%, 45%, .02) 80%, transparent 100%)",
        }}
        className="absolute top-0 left-0"
      />
    </div>
  );
};