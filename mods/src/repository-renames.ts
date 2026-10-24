import { createContext, useContext } from "react";
import type { RepositoryRenames } from "./lib/markdown";

/** The current page's {@link RepositoryRenames}, for avatars and READMEs. */
export const RenamesContext = createContext<RepositoryRenames>({});

export function useRenames(): RepositoryRenames {
  return useContext(RenamesContext);
}
