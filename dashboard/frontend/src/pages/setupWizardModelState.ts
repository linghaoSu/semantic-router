import {
  createModelDraft,
  PROVIDER_OPTIONS,
  type ModelDraft,
  type ProviderKind,
} from './setupWizardSupport'

export function addSetupModel(models: ModelDraft[]) {
  return [...models, createModelDraft(models.length + 1)]
}

export function updateSetupModel(
  models: ModelDraft[],
  id: string,
  field: keyof ModelDraft,
  value: string,
) {
  return models.map((model) => {
    if (model.id !== id) {
      return model
    }

    if (field === 'providerKind') {
      const nextProvider = value as ProviderKind
      const nextPlaceholder = PROVIDER_OPTIONS.find(
        (option) => option.id === nextProvider,
      )?.placeholder
      return {
        ...model,
        providerKind: nextProvider,
        baseUrl: model.baseUrl.trim() ? model.baseUrl : nextPlaceholder || model.baseUrl,
      }
    }

    return { ...model, [field]: value }
  })
}

export function removeSetupModel(models: ModelDraft[], id: string) {
  return models.filter((model) => model.id !== id)
}
