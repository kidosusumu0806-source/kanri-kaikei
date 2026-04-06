// src/main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Supabase版を使う場合は AppSupabase を import
// localStorage版（デモ）は App を import
import App from "./AppSupabase.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
