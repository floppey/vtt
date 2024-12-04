import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { MapSettingsProvider } from "./context/mapSettingsContext";
import { VttProvider } from "./context/vttContext";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <VttProvider>
      <MapSettingsProvider>
        <App />
      </MapSettingsProvider>
    </VttProvider>
  </React.StrictMode>
);
