import { ConfigData, SignalType } from './configPageSupport'

export const listInputToArray = (input: string) => input
  .split(/[\n,]/)
  .map(item => item.trim())
  .filter(Boolean)

export const removeSignalByName = (cfg: ConfigData, type: SignalType, targetName: string) => {
  if (!cfg.signals) cfg.signals = {}

  switch (type) {
    case 'Keywords':
      cfg.signals.keywords = (cfg.signals.keywords || []).filter(s => s.name !== targetName)
      break
    case 'Embeddings':
      cfg.signals.embeddings = (cfg.signals.embeddings || []).filter(s => s.name !== targetName)
      break
    case 'Domain':
      cfg.signals.domains = (cfg.signals.domains || []).filter(s => s.name !== targetName)
      break
    case 'Preference':
      cfg.signals.preferences = (cfg.signals.preferences || []).filter(s => s.name !== targetName)
      break
    case 'Fact Check':
      cfg.signals.fact_check = (cfg.signals.fact_check || []).filter(s => s.name !== targetName)
      break
    case 'User Feedback':
      cfg.signals.user_feedbacks = (cfg.signals.user_feedbacks || []).filter(s => s.name !== targetName)
      break
    case 'Reask':
      cfg.signals.reasks = (cfg.signals.reasks || []).filter(s => s.name !== targetName)
      break
    case 'Language':
      cfg.signals.language = (cfg.signals.language || []).filter(s => s.name !== targetName)
      break
    case 'Context':
      cfg.signals.context = (cfg.signals.context || []).filter(s => s.name !== targetName)
      break
    case 'Structure':
      cfg.signals.structure = (cfg.signals.structure || []).filter(s => s.name !== targetName)
      break
    case 'Complexity':
      cfg.signals.complexity = (cfg.signals.complexity || []).filter(s => s.name !== targetName)
      break
    case 'Modality':
      cfg.signals.modality = (cfg.signals.modality || []).filter(s => s.name !== targetName)
      break
    case 'Authz':
      cfg.signals.role_bindings = (cfg.signals.role_bindings || []).filter(s => s.name !== targetName)
      break
    case 'Jailbreak':
      cfg.signals.jailbreak = (cfg.signals.jailbreak || []).filter(s => s.name !== targetName)
      break
    case 'PII':
      cfg.signals.pii = (cfg.signals.pii || []).filter(s => s.name !== targetName)
      break
    case 'KB':
      cfg.signals.kb = (cfg.signals.kb || []).filter(s => s.name !== targetName)
      break
    default:
      break
  }
}

export const removeDecisionByName = (cfg: ConfigData, targetName: string) => {
  cfg.decisions = (cfg.decisions || []).filter(d => d.name !== targetName)
}
