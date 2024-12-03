import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { MapSettingsProvider } from "./context/mapSettings";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <MapSettingsProvider>
      <App />
    </MapSettingsProvider>
  </React.StrictMode>
);
