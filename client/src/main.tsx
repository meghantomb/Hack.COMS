import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { MinigameTester } from "./minigames/MinigameTester";
import "./index.css";

const minigameTest = new URLSearchParams(window.location.search).has("minigames");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {minigameTest ? <MinigameTester /> : <App />}
  </React.StrictMode>
);
