import type { ComponentType } from 'react'

import {
  GateAND,
  GateNOT,
  GateOR,
  type GateShapeProps,
} from './ExpressionBuilderGateShapes'
import type { RuleNode } from './ExpressionBuilderSupport'

export type OperatorKind = 'AND' | 'OR' | 'NOT'

export const OPERATOR_ORDER: OperatorKind[] = ['AND', 'OR', 'NOT']

export const OPERATOR_META: Record<
  OperatorKind,
  {
    color: string
    description: string
    icon: string
    GateShape: ComponentType<GateShapeProps>
  }
> = {
  AND: {
    color: '#818cf8',
    description: 'A AND B',
    icon: '∧',
    GateShape: GateAND,
  },
  OR: {
    color: '#34d399',
    description: 'A OR B',
    icon: '∨',
    GateShape: GateOR,
  },
  NOT: {
    color: '#f87171',
    description: 'NOT A',
    icon: '¬',
    GateShape: GateNOT,
  },
}

export interface BuilderTemplate {
  name: string
  op: OperatorKind
  desc: string
  build: () => RuleNode
}

export const BUILDER_TEMPLATES: BuilderTemplate[] = [
  {
    name: 'AND Gate',
    op: 'AND',
    desc: OPERATOR_META.AND.description,
    build: () => ({ operator: 'AND', conditions: [] }),
  },
  {
    name: 'OR Gate',
    op: 'OR',
    desc: OPERATOR_META.OR.description,
    build: () => ({ operator: 'OR', conditions: [] }),
  },
  {
    name: 'NOT Gate',
    op: 'NOT',
    desc: OPERATOR_META.NOT.description,
    build: () => ({ operator: 'NOT', conditions: [] as unknown as [RuleNode] }),
  },
]
