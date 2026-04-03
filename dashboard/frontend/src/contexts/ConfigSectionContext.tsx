import React, { useState } from "react";
import { ConfigSectionContext } from "./ConfigSectionShared";
import type { ConfigSectionState } from "./ConfigSectionShared";

export const ConfigSectionProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [configSection, setConfigSection] =
    useState<ConfigSectionState["configSection"]>("global-config");

  return (
    <ConfigSectionContext.Provider value={{ configSection, setConfigSection }}>
      {children}
    </ConfigSectionContext.Provider>
  );
};
