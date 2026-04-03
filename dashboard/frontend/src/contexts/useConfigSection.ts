import { useContext } from "react";

import {
  ConfigSectionContext,
  type ConfigSectionState,
} from "./ConfigSectionShared";

export function useConfigSection(): ConfigSectionState {
  const ctx = useContext(ConfigSectionContext);
  if (!ctx) {
    throw new Error("useConfigSection must be used within ConfigSectionProvider");
  }
  return ctx;
}
