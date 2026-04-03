import type { DSLFieldObject } from "@/types/dsl";
import type { RoutePluginInput } from "@/lib/dslMutations";

import { PluginSchemaEditor } from "./builderPageEntityForms";
import styles from "./BuilderPage.module.css";
import { ManualPluginAdder } from "./builderPageRouteSharedControls";
import type { AvailablePlugin } from "./builderPageTypes";

interface BuilderPageRoutePluginsCardProps {
  activePluginNames: Set<string>;
  availablePlugins: AvailablePlugin[];
  emptyMessage: string;
  plugins: RoutePluginInput[];
  showPluginType: boolean;
  onAddManualPlugin: (name: string) => void;
  onTogglePlugin: (pluginName: string) => void;
  onUpdatePluginFields: (pluginName: string, fields: DSLFieldObject) => void;
}

export default function BuilderPageRoutePluginsCard({
  activePluginNames,
  availablePlugins,
  emptyMessage,
  plugins,
  showPluginType,
  onAddManualPlugin,
  onTogglePlugin,
  onUpdatePluginFields,
}: BuilderPageRoutePluginsCardProps) {
  return (
    <div className={styles.dslPreview}>
      <div className={styles.dslPreviewHeader}>
        <span className={styles.dslPreviewTitle}>
          Plugins ({plugins.length})
        </span>
      </div>
      <div
        style={{
          padding: "var(--spacing-md)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--spacing-sm)",
        }}
      >
        {availablePlugins.length > 0 ? (
          <div className={styles.pluginToggleGrid}>
            {availablePlugins.map((plugin) => {
              const active = activePluginNames.has(plugin.name);
              return (
                <button
                  key={plugin.name}
                  className={
                    active ? styles.pluginToggleActive : styles.pluginToggle
                  }
                  onClick={() => onTogglePlugin(plugin.name)}
                  title={
                    showPluginType
                      ? `${active ? "Remove" : "Add"} plugin ${plugin.name}`
                      : undefined
                  }
                >
                  <span className={styles.pluginToggleCheck}>
                    {active ? "✓" : "○"}
                  </span>
                  <span className={styles.pluginToggleName}>{plugin.name}</span>
                  {showPluginType ? (
                    <span className={styles.pluginToggleType}>
                      {plugin.pluginType}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : (
          <span
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--color-text-muted)",
            }}
          >
            {emptyMessage}
          </span>
        )}

        {plugins.length > 0 ? (
          <div
            style={{
              marginTop: "var(--spacing-sm)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--spacing-sm)",
            }}
          >
            <span className={styles.fieldLabel} style={{ display: "block" }}>
              Plugin Configuration
            </span>
            {plugins.map((plugin) => {
              const template = availablePlugins.find((entry) => entry.name === plugin.name);
              const pluginType = template?.pluginType ?? plugin.name;
              return (
                <div key={plugin.name} className={styles.pluginOverride}>
                  <PluginSchemaEditor
                    pluginType={pluginType}
                    pluginName={plugin.name}
                    fields={plugin.fields ?? {}}
                    onUpdate={(fields) => onUpdatePluginFields(plugin.name, fields)}
                    compact
                  />
                </div>
              );
            })}
          </div>
        ) : null}

        <ManualPluginAdder
          existingNames={activePluginNames}
          onAdd={(name) => onAddManualPlugin(name)}
        />
      </div>
    </div>
  );
}
