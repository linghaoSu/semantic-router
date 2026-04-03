import { createContext } from "react";

import type { ConfigSection } from "../components/ConfigNav";

export interface ConfigSectionState {
  configSection: ConfigSection;
  setConfigSection: (section: ConfigSection) => void;
}

export const ConfigSectionContext = createContext<ConfigSectionState | null>(
  null,
);
