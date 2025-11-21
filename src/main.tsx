import React from "react";
import ReactDOM from "react-dom/client";
import MortgageBrokerApp from "./MortgageBrokerApp";
import "./main.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Missing #root container for MortgageBroker preview");
}

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <MortgageBrokerApp />
  </React.StrictMode>
);
