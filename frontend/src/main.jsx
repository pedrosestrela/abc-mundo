import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./i18n/index.js";
import App from "./App.jsx";
import AccessGate from "./components/AccessGate.jsx";
import "./styles.css";

// Second half of the 404.html SPA-redirect trick (see public/404.html):
// restore the real path/query/hash before react-router mounts, so a direct
// link or refresh on e.g. /abc-mundo/writing lands on the right screen
// instead of always falling back to "/". A no-op when this query param
// isn't present (every other build/host, and normal in-app navigation).
(function restoreSpaRedirect() {
  const params = new URLSearchParams(window.location.search);
  const redirectPath = params.get("spa-redirect");
  if (redirectPath === null) return;
  params.delete("spa-redirect");
  const query = params.toString();
  const newUrl =
    window.location.pathname.replace(/[^/]*$/, "") +
    redirectPath +
    (query ? "?" + query : "") +
    window.location.hash;
  window.history.replaceState(null, "", newUrl);
})();

// On GitHub Pages (project site under /abc-mundo/), react-router needs a
// matching `basename` so links/navigation stay under that prefix instead of
// treating routes as if the app were served at the domain root. Vite's
// import.meta.env.BASE_URL already reflects the `base` set in vite.config.js
// ("/" for the Fly.io build, "/abc-mundo/" for the Pages build).
const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

// Only the public GitHub Pages build shows the access gate (see
// AccessGate.jsx) -- set via VITE_ENABLE_GATE=true in deploy-pages.yml.
const gateEnabled = import.meta.env.VITE_ENABLE_GATE === "true";

const app = (
  <BrowserRouter basename={basename}>
    <App />
  </BrowserRouter>
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>{gateEnabled ? <AccessGate>{app}</AccessGate> : app}</React.StrictMode>
);
