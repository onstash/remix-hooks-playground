import { createRoot } from "@remix-run/dom";
import { App } from "./app";

createRoot(document.querySelector("#app")!).render(<App />);
