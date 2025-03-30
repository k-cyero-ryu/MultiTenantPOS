import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import './i18n'; // Import i18n configuration
import { LanguageProvider } from './providers/language-provider';

createRoot(document.getElementById("root")!).render(
  <LanguageProvider>
    <App />
  </LanguageProvider>
);
