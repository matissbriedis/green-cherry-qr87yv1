// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n"; // Initialize i18n
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <I18nextProvider i18n={i18n}>
    <React.StrictMode>
      <Suspense fallback={<div>Loading...</div>}>
        <App />
      </Suspense>
    </React.StrictMode>
  </I18nextProvider>
);
