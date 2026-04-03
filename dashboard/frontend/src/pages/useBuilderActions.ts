import { useCallback, useEffect, useRef, useState } from "react";

import { useDSLStore } from "@/stores/dslStore";
import type { DSLFieldObject } from "@/types/dsl";
import type { RouteInput } from "@/lib/dslMutations";

import type { EntityKind, Selection } from "./builderPageTypes";

export function useBuilderEntityActions(
  setSelection: (s: Selection | null) => void,
  setAddingEntity: (e: EntityKind | null) => void,
) {
  const {
    deleteModel,
    deleteSignal,
    deleteRoute,
    deletePlugin,
    mutateModel,
    mutateSignal,
    mutatePlugin,
    mutateRoute,
    addModel,
    addSignal,
    addPlugin,
    addRoute,
  } = useDSLStore();

  const handleDeleteEntity = useCallback(
    (kind: EntityKind, name: string, subType?: string) => {
      switch (kind) {
        case "model":
          deleteModel(name);
          break;
        case "signal":
          if (subType) deleteSignal(subType, name);
          break;
        case "route":
          deleteRoute(name);
          break;
        case "plugin":
          if (subType) deletePlugin(name, subType);
          break;
      }
      setSelection(null);
    },
    [deleteModel, deleteSignal, deleteRoute, deletePlugin, setSelection],
  );

  const handleUpdateModelFields = useCallback(
    (name: string, fields: DSLFieldObject) => {
      mutateModel(name, fields);
    },
    [mutateModel],
  );

  const handleAddModel = useCallback(
    (name: string, fields: DSLFieldObject) => {
      addModel(name, fields);
      setSelection({ kind: "model", name });
      setAddingEntity(null);
    },
    [addModel, setSelection, setAddingEntity],
  );

  const handleUpdateSignalFields = useCallback(
    (signalType: string, name: string, fields: DSLFieldObject) => {
      mutateSignal(signalType, name, fields);
    },
    [mutateSignal],
  );

  const handleUpdatePluginFields = useCallback(
    (name: string, pluginType: string, fields: DSLFieldObject) => {
      mutatePlugin(name, pluginType, fields);
    },
    [mutatePlugin],
  );

  const handleAddSignal = useCallback(
    (signalType: string, name: string, fields: DSLFieldObject) => {
      addSignal(signalType, name, fields);
      setSelection({ kind: "signal", name });
      setAddingEntity(null);
    },
    [addSignal, setSelection, setAddingEntity],
  );

  const handleAddPlugin = useCallback(
    (name: string, pluginType: string, fields: DSLFieldObject) => {
      addPlugin(name, pluginType, fields);
      setSelection({ kind: "plugin", name });
      setAddingEntity(null);
    },
    [addPlugin, setSelection, setAddingEntity],
  );

  const handleUpdateRoute = useCallback(
    (name: string, input: RouteInput) => {
      mutateRoute(name, input);
    },
    [mutateRoute],
  );

  const handleAddRoute = useCallback(
    (name: string, input: RouteInput) => {
      addRoute(name, input);
      setSelection({ kind: "route", name });
      setAddingEntity(null);
    },
    [addRoute, setSelection, setAddingEntity],
  );

  return {
    handleDeleteEntity,
    handleUpdateModelFields,
    handleAddModel,
    handleUpdateSignalFields,
    handleUpdatePluginFields,
    handleAddSignal,
    handleAddPlugin,
    handleUpdateRoute,
    handleAddRoute,
  };
}

export function useBuilderImport() {
  const { importYaml, compile, loadFromRouter } = useDSLStore();

  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importUrl, setImportUrl] = useState("");
  const [importUrlLoading, setImportUrlLoading] = useState(false);
  const [loadingFromRouter, setLoadingFromRouter] = useState(false);

  const importTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleOpenImport = useCallback(() => {
    setImportText("");
    setImportError(null);
    setImportUrl("");
    setImportUrlLoading(false);
    setShowImportModal(true);
    setTimeout(() => importTextareaRef.current?.focus(), 50);
  }, []);

  const handleImportConfirm = useCallback(() => {
    const yaml = importText.trim();
    if (!yaml) {
      setImportError("Please paste YAML content");
      return;
    }
    try {
      importYaml(yaml);
      compile();
      setShowImportModal(false);
      setImportText("");
      setImportError(null);
    } catch {
      setImportError(
        "Failed to import YAML. Use a full router config or routing fragment; only the routing section is imported into DSL.",
      );
    }
  }, [importText, importYaml, compile]);

  const handleImportFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result;
        if (typeof text === "string") {
          setImportText(text);
          setImportError(null);
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [],
  );

  const handleImportUrl = useCallback(async () => {
    const url = importUrl.trim();
    if (!url) {
      setImportError("Please enter a URL");
      return;
    }
    try {
      new URL(url);
    } catch {
      setImportError("Invalid URL format");
      return;
    }
    setImportUrlLoading(true);
    setImportError(null);
    try {
      const resp = await fetch("/api/tools/fetch-raw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await resp.json();
      if (data.error) {
        throw new Error(data.error);
      }
      if (!data.content?.trim()) {
        throw new Error("Remote returned empty content");
      }
      setImportText(data.content);
      setImportError(null);
    } catch (err) {
      setImportError(
        `Failed to fetch: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setImportUrlLoading(false);
    }
  }, [importUrl]);

  const handleLoadFromRouter = useCallback(async () => {
    setLoadingFromRouter(true);
    setImportError(null);
    try {
      await loadFromRouter();
      compile();
      setShowImportModal(false);
      setImportText("");
    } catch (err) {
      setImportError(
        `Failed to load from router: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setLoadingFromRouter(false);
    }
  }, [loadFromRouter, compile]);

  return {
    showImportModal,
    importText,
    importError,
    importUrl,
    importUrlLoading,
    loadingFromRouter,
    importTextareaRef,
    fileInputRef,
    setLoadingFromRouter,
    setImportError,
    handleOpenImport,
    handleImportConfirm,
    handleImportFile,
    handleImportUrl,
    handleLoadFromRouter,
    closeImportModal: () => setShowImportModal(false),
    setImportUrl: (value: string) => {
      setImportUrl(value);
      setImportError(null);
    },
    setImportText: (value: string) => {
      setImportText(value);
      setImportError(null);
    },
  };
}

export function useBuilderAutoLoad(
  wasmReady: boolean,
  readonlyLoading: boolean,
  dslSource: string,
  setLoadingFromRouter: (v: boolean) => void,
  setImportError: (e: string | null) => void,
) {
  const { loadFromRouter, compile } = useDSLStore();
  const autoLoadedRef = useRef(false);
  const autoLoadingRef = useRef(false);

  useEffect(() => {
    if (
      !wasmReady ||
      readonlyLoading ||
      dslSource.trim() ||
      autoLoadedRef.current ||
      autoLoadingRef.current
    ) {
      return;
    }

    autoLoadingRef.current = true;
    let cancelled = false;
    const loadDefaultConfig = async () => {
      setLoadingFromRouter(true);
      setImportError(null);
      try {
        await loadFromRouter();
        if (!cancelled) {
          compile();
          autoLoadedRef.current = true;
        }
      } catch (err) {
        console.error(
          "[BuilderPage] Failed to load default router config:",
          err,
        );
      } finally {
        autoLoadingRef.current = false;
        if (!cancelled) {
          setLoadingFromRouter(false);
        }
      }
    };
    void loadDefaultConfig();
    return () => {
      cancelled = true;
    };
  }, [wasmReady, readonlyLoading, dslSource, loadFromRouter, compile, setLoadingFromRouter, setImportError]);
}
