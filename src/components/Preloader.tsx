"use client";

import React from "react";

export default function Preloader(): JSX.Element {
  const [visible, setVisible] = React.useState(true);
  const [fade, setFade] = React.useState(false);

  React.useEffect(() => {
    // When this effect runs, the app has hydrated on the client
    // trigger a quick fade and then hide the preloader
    // Show preloader a bit longer: start fade after 800ms,
    // then hide entirely after 1500ms (fade takes 600ms)
    const fadeTimer = setTimeout(() => setFade(true), 800);
    const hideTimer = setTimeout(() => setVisible(false), 1500);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return <></>;

  return (
    <div
      className={`preloader-root ${fade ? "preloader--fadeout" : ""}`}
      aria-hidden={!visible}
    >
      <img src="/logo.png" alt="Leads Xenia" className="preloader__img" />
    </div>
  );
}
