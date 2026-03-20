import { useMemo } from "react"
import styles from "./DashboardDecisionsOverview.module.css"
import { DecisionRule, getDecisionCategory, } from "./dashboardSupport"
import { useNavigate } from "react-router-dom"

export const DashboardDecisionsOverview: React.FC<{
  currentDecisions: DecisionRule[],
}> = ({
  currentDecisions,
}) => {
    const navigate = useNavigate()
    // Categorize decisions for the table
    const categorizedDecisions = useMemo(() => {
      const decisions = currentDecisions ?? []
      if (decisions.length === 0) return { guardrails: [], routing: [], fallbacks: [] }
      const guardrails: DecisionRule[] = []
      const routing: DecisionRule[] = []
      const fallbacks: DecisionRule[] = []
      for (const d of decisions) {
        const cat = getDecisionCategory(d.priority)
        if (cat === 'guardrail') guardrails.push(d)
        else if (cat === 'fallback') fallbacks.push(d)
        else routing.push(d)
      }
      return { guardrails, routing, fallbacks }
    }, [currentDecisions])

    return (
      <div className={styles.decisionTable}>
        <div className={styles.decisionTableHead}>
          <span>Name</span>
          <span>Priority</span>
          <span>Type</span>
          <span>Models</span>
        </div>
        {/* Guardrails first, then routing, then fallbacks — show top 10 */}
        {[...categorizedDecisions.guardrails, ...categorizedDecisions.routing, ...categorizedDecisions.fallbacks]
          .slice(0, 10)
          .map((d, i) => {
            const modelNames = Array.isArray(d.modelRefs)
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ? d.modelRefs.map((m: any) => m?.model || '').filter(Boolean).join(', ')
              : '—'
            const cat = getDecisionCategory(d.priority)
            return (
              <div key={i} className={styles.decisionTableRow}>
                <span className={styles.decisionName} title={d.description || d.name || ''}>
                  {d.name || `Decision ${i + 1}`}
                </span>
                <span className={styles.decisionPriority}>{d.priority ?? '—'}</span>
                <span className={`${styles.decisionBadge} ${cat === 'guardrail' ? styles.badgeGuardrail :
                  cat === 'fallback' ? styles.badgeFallback :
                    styles.badgeRouting
                  }`}>
                  {cat === 'guardrail' ? 'Guard' : cat === 'fallback' ? 'Default' : 'Route'}
                </span>
                <span className={styles.decisionModels} title={modelNames}>{modelNames}</span>
              </div>
            )
          })}
        {currentDecisions.length > 10 && (
          <button className={styles.decisionTableMore} onClick={() => navigate('/config/decisions')}>
            +{currentDecisions.length - 10} more decisions &rsaquo;
          </button>
        )}
      </div>
    )
  }
