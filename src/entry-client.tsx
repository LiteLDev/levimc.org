import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { App } from "./App";
import { loadMarkdown } from "./components/lazy-markdown";
import { readEmbeddedPageData } from "./page-data";
import { PageStore } from "./page-store";
import "./styles.css";

async function hydrate() {
  const data = readEmbeddedPageData();
  const root = document.getElementById("root");
  if (!data || !root) return;

  // A package page renders its README while hydrating, like the server did.
  // Should the chunk fail to load, hydrate anyway: the README keeps its
  // server HTML while React retries the chunk.
  if (data.kind === "package") await loadMarkdown().catch(() => {});

  const store = new PageStore(window.location.pathname, data);
  hydrateRoot(
    root,
    <StrictMode>
      <BrowserRouter>
        <App store={store} />
      </BrowserRouter>
    </StrictMode>,
  );
}

void hydrate();
