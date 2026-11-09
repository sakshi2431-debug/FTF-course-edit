import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "./styles.css";
import "./aurora/aurora.css";
import LegacyApp from "./legacy/LegacyApp";
import AuroraApp from "./aurora/App";

/* The earlier frame-exact screens stay at their own URLs for comparison. */
const LEGACY_ROUTES = ["#/sidebar", "#/ai-chat", "#/validate", "#/publish"];

function Root() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return LEGACY_ROUTES.includes(hash) ? <LegacyApp /> : <AuroraApp />;
}

createRoot(document.getElementById("root")!).render(<Root />);
