import React, { useState } from 'react'
import styles from './ConfigPage.module.css'
import { ConfigSection } from '../components/ConfigNav'
import EditModal, { type EditFormData, FieldConfig } from '../components/EditModal'
import ViewModal, { ViewSection } from '../components/ViewModal'
import { useReadonly } from '../contexts/ReadonlyContext'
import ConfigPageRouterConfigSection from './ConfigPageRouterConfigSection'
import ConfigPageModelsSection from './ConfigPageModelsSection'
import ConfigPageSignalsSection from './ConfigPageSignalsSection'
import ConfigPageDecisionsSection from './ConfigPageDecisionsSection'
import ConfigPageMCPSection from './ConfigPageMCPSection'
import {
  listInputToArray,
  removeSignalByName,
  removeDecisionByName,
} from './configPageSupport'
import type { OpenViewModal } from './configPageRouterSectionSupport'
import { useConfigPageData } from './useConfigPageData'

interface ConfigPageProps {
  activeSection?: ConfigSection
}

const ConfigPage: React.FC<ConfigPageProps> = ({ activeSection = 'global-config' }) => {
  const { isReadonly } = useReadonly()
  const {
    config,
    loading,
    error,
    isPythonCLI,
    models,
    defaultModel,
    reasoningFamilies,
    toolsData,
    toolsLoading,
    toolsError,
    saveConfig,
    refreshConfig,
  } = useConfigPageData()

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editModalTitle, setEditModalTitle] = useState('')
  const [editModalData, setEditModalData] = useState<EditFormData | null>(null)
  const [editModalFields, setEditModalFields] = useState<FieldConfig[]>([])
  const [editModalMode, setEditModalMode] = useState<'edit' | 'add'>('edit')
  const [editModalCallback, setEditModalCallback] = useState<((data: EditFormData) => Promise<void>) | null>(null)

  // View modal state
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewModalTitle, setViewModalTitle] = useState('')
  const [viewModalSections, setViewModalSections] = useState<ViewSection[]>([])
  const [viewModalEditCallback, setViewModalEditCallback] = useState<(() => void) | null>(null)

  // Search state
  const [decisionsSearch, setDecisionsSearch] = useState('')
  const [signalsSearch, setSignalsSearch] = useState('')
  const [modelsSearch, setModelsSearch] = useState('')

  // Expandable rows state for models
  const [expandedModels, setExpandedModels] = useState<Set<string>>(new Set())

  const openEditModal = <TForm extends object>(
    title: string,
    data: TForm,
    fields: FieldConfig<TForm>[],
    callback: (data: TForm) => Promise<void>,
    mode: 'edit' | 'add' = 'edit'
  ) => {
    setEditModalTitle(title)
    setEditModalData(data as EditFormData)
    setEditModalFields(fields as FieldConfig[])
    setEditModalMode(mode)
    setEditModalCallback(() => async (rawData: EditFormData) => callback(rawData as TForm))
    setEditModalOpen(true)
  }

  const closeEditModal = () => {
    setEditModalOpen(false)
    setEditModalData(null)
    setEditModalFields([])
    setEditModalCallback(null)
  }

  const openViewModal: OpenViewModal = (title, sections, onEdit) => {
    setViewModalTitle(title)
    setViewModalSections(sections)
    setViewModalEditCallback(() => onEdit || null)
    setViewModalOpen(true)
  }

  const handleCloseViewModal = () => {
    setViewModalOpen(false)
    setViewModalTitle('')
    setViewModalSections([])
    setViewModalEditCallback(null)
  }

  // ============================================================================
  // SECTION PANEL RENDERS - Aligned with Python CLI config structure
  // ============================================================================

  const renderSignalsSection = () => (
    <ConfigPageSignalsSection
      config={config}
      isPythonCLI={isPythonCLI}
      isReadonly={isReadonly}
      signalsSearch={signalsSearch}
      onSignalsSearchChange={setSignalsSearch}
      saveConfig={saveConfig}
      openEditModal={openEditModal}
      openViewModal={openViewModal}
      listInputToArray={listInputToArray}
      removeSignalByName={removeSignalByName}
    />
  )

  const renderDecisionsSection = () => (
    <ConfigPageDecisionsSection
      config={config}
      isPythonCLI={isPythonCLI}
      isReadonly={isReadonly}
      decisionsSearch={decisionsSearch}
      onDecisionsSearchChange={setDecisionsSearch}
      saveConfig={saveConfig}
      openEditModal={openEditModal}
      openViewModal={openViewModal}
      removeDecisionByName={removeDecisionByName}
      models={models}
    />
  )

  const renderModelsSection = () => (
    <ConfigPageModelsSection
      config={config}
      isPythonCLI={isPythonCLI}
      isReadonly={isReadonly}
      models={models}
      defaultModel={defaultModel}
      reasoningFamilies={reasoningFamilies}
      modelsSearch={modelsSearch}
      onModelsSearchChange={setModelsSearch}
      expandedModels={expandedModels}
      onExpandedModelsChange={setExpandedModels}
      saveConfig={saveConfig}
      openEditModal={openEditModal}
      openViewModal={openViewModal}
      listInputToArray={listInputToArray}
    />
  )

  // Global Config section - canonical global override editor backed by effective router defaults
  const renderGlobalConfigSection = () => (
    <ConfigPageRouterConfigSection
      config={config}
      toolsData={toolsData}
      toolsLoading={toolsLoading}
      toolsError={toolsError}
      isReadonly={isReadonly}
      openEditModal={openEditModal}
      saveConfig={saveConfig}
      refreshConfig={refreshConfig}
      showLegacyCategories={!isPythonCLI}
    />
  )

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'signals':
        return renderSignalsSection()
      case 'decisions':
        return renderDecisionsSection()
      case 'models':
        return renderModelsSection()
      case 'global-config':
        return renderGlobalConfigSection()
      case 'mcp':
        return <ConfigPageMCPSection />
      default:
        return renderGlobalConfigSection()
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {loading && (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading configuration...</p>
          </div>
        )}

        {error && !loading && (
          <div className={styles.error}>
            <span className={styles.errorIcon}></span>
            <div>
              <h3>Error Loading Config</h3>
              <p>{error}</p>
            </div>
          </div>
        )}

        {config && !loading && !error && (
          <div className={styles.contentArea}>
            {renderActiveSection()}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <EditModal
        isOpen={editModalOpen}
        onClose={closeEditModal}
        onSave={editModalCallback || (async () => { })}
        title={editModalTitle}
        data={editModalData}
        fields={editModalFields}
        mode={editModalMode}
      />

      {/* View Modal */}
      <ViewModal
        isOpen={viewModalOpen}
        onClose={handleCloseViewModal}
        onEdit={isReadonly ? undefined : (viewModalEditCallback || undefined)}
        title={viewModalTitle}
        sections={viewModalSections}
      />
    </div>
  )
}

export default ConfigPage
