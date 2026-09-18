import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { seedAll } from "./lib/seedAll";

seedAll();

createRoot(document.getElementById("root")!).render(<App />);
