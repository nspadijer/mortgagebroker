import React from "react";
import { createRoot } from "react-dom/client";
import MortgageBrokerApp from "./MortgageBrokerApp";

const WIDGET_ROOT_ID = "mortgagebroker-root";

const mount = () => {
  const container = document.getElementById(WIDGET_ROOT_ID);
  if (!container) {
    console.error(`MortgageBroker widget is missing #${WIDGET_ROOT_ID}`);
    return;
  }

  createRoot(container).render(
    <React.StrictMode>
      <MortgageBrokerApp />
    </React.StrictMode>
  );
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount, { once: true });
} else {
  mount();
}
