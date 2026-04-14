import { useCallback } from "react";

import type { DSLFieldObject } from "@/types/dsl";
import type { RouteInput } from "@/lib/dslMutations";

import type { EntityKind, Selection } from "./builderPageTypes";

export interface BuilderEntityStoreActions {
  addModel: (name: string, fields: DSLFieldObject) => void;
  deleteModel: (name: string) => void;
  mutateModel: (name: string, fields: DSLFieldObject) => void;
  addSignal: (signalType: string, name: string, fields: DSLFieldObject) => void;
  deleteSignal: (signalType: string, name: string) => void;
  mutateSignal: (signalType: string, name: string, fields: DSLFieldObject) => void;
  addPlugin: (name: string, pluginType: string, fields: DSLFieldObject) => void;
  deletePlugin: (name: string, pluginType: string) => void;
  mutatePlugin: (name: string, pluginType: string, fields: DSLFieldObject) => void;
  addProjectionPartition: (name: string, fields: DSLFieldObject) => void;
  deleteProjectionPartition: (name: string) => void;
  mutateProjectionPartition: (name: string, fields: DSLFieldObject) => void;
  addProjectionScore: (name: string, fields: DSLFieldObject) => void;
  deleteProjectionScore: (name: string) => void;
  mutateProjectionScore: (name: string, fields: DSLFieldObject) => void;
  addProjectionMapping: (name: string, fields: DSLFieldObject) => void;
  deleteProjectionMapping: (name: string) => void;
  mutateProjectionMapping: (name: string, fields: DSLFieldObject) => void;
  addRoute: (name: string, input: RouteInput) => void;
  deleteRoute: (name: string) => void;
  mutateRoute: (name: string, input: RouteInput) => void;
}

export interface UseBuilderEntityHandlersOptions {
  actions: BuilderEntityStoreActions;
  setSelection: (selection: Selection | null) => void;
  setAddingEntity: (kind: EntityKind | null) => void;
}

export function useBuilderEntityHandlers({
  actions,
  setSelection,
  setAddingEntity,
}: UseBuilderEntityHandlersOptions) {
  const {
    addModel,
    deleteModel,
    mutateModel,
    addSignal,
    deleteSignal,
    mutateSignal,
    addPlugin,
    deletePlugin,
    mutatePlugin,
    addProjectionPartition,
    deleteProjectionPartition,
    mutateProjectionPartition,
    addProjectionScore,
    deleteProjectionScore,
    mutateProjectionScore,
    addProjectionMapping,
    deleteProjectionMapping,
    mutateProjectionMapping,
    addRoute,
    deleteRoute,
    mutateRoute,
  } = actions;

  const handleDeleteEntity = useCallback(
    (kind: EntityKind, name: string, subType?: string) => {
      switch (kind) {
        case "model":
          deleteModel(name);
          break;
        case "signal":
          if (subType) deleteSignal(subType, name);
          break;
        case "projection-partition":
          deleteProjectionPartition(name);
          break;
        case "projection-score":
          deleteProjectionScore(name);
          break;
        case "projection-mapping":
          deleteProjectionMapping(name);
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
    [
      deleteModel,
      deleteSignal,
      deleteProjectionPartition,
      deleteProjectionScore,
      deleteProjectionMapping,
      deleteRoute,
      deletePlugin,
      setSelection,
    ],
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

  const handleUpdateProjectionPartitionFields = useCallback(
    (name: string, fields: DSLFieldObject) => {
      mutateProjectionPartition(name, fields);
    },
    [mutateProjectionPartition],
  );

  const handleUpdateProjectionScoreFields = useCallback(
    (name: string, fields: DSLFieldObject) => {
      mutateProjectionScore(name, fields);
    },
    [mutateProjectionScore],
  );

  const handleUpdateProjectionMappingFields = useCallback(
    (name: string, fields: DSLFieldObject) => {
      mutateProjectionMapping(name, fields);
    },
    [mutateProjectionMapping],
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

  const handleAddProjectionPartition = useCallback(
    (name: string, fields: DSLFieldObject) => {
      addProjectionPartition(name, fields);
      setSelection({ kind: "projection-partition", name });
      setAddingEntity(null);
    },
    [addProjectionPartition, setSelection, setAddingEntity],
  );

  const handleAddProjectionScore = useCallback(
    (name: string, fields: DSLFieldObject) => {
      addProjectionScore(name, fields);
      setSelection({ kind: "projection-score", name });
      setAddingEntity(null);
    },
    [addProjectionScore, setSelection, setAddingEntity],
  );

  const handleAddProjectionMapping = useCallback(
    (name: string, fields: DSLFieldObject) => {
      addProjectionMapping(name, fields);
      setSelection({ kind: "projection-mapping", name });
      setAddingEntity(null);
    },
    [addProjectionMapping, setSelection, setAddingEntity],
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
    handleUpdateProjectionPartitionFields,
    handleUpdateProjectionScoreFields,
    handleUpdateProjectionMappingFields,
    handleAddSignal,
    handleAddPlugin,
    handleAddProjectionPartition,
    handleAddProjectionScore,
    handleAddProjectionMapping,
    handleUpdateRoute,
    handleAddRoute,
  };
}
