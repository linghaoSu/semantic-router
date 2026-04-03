import type { FC } from 'react'

import styles from './ExpressionBuilder.module.css'

export interface GateShapeProps {
  color: string
  opacity?: number
}

export const GateAND: FC<GateShapeProps> = ({ color, opacity = 1 }) => (
  <svg viewBox="0 0 84 64" width="84" height="64" className={styles.gateSvg} style={{ opacity }}>
    <path
      d="M 6 4 L 78 4 L 78 30 Q 78 60 42 60 Q 6 60 6 30 Z"
      fill={color.replace(/[\d.]+\)$/, '0.08)')}
      stroke={color}
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
  </svg>
)

export const GateOR: FC<GateShapeProps> = ({ color, opacity = 1 }) => (
  <svg viewBox="0 0 84 64" width="84" height="64" className={styles.gateSvg} style={{ opacity }}>
    <path
      d="M 6 4 Q 42 18 78 4 Q 74 44 42 62 Q 10 44 6 4 Z"
      fill={color.replace(/[\d.]+\)$/, '0.08)')}
      stroke={color}
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
  </svg>
)

export const GateNOT: FC<GateShapeProps> = ({ color, opacity = 1 }) => (
  <svg viewBox="0 0 84 70" width="84" height="70" className={styles.gateSvg} style={{ opacity }}>
    <path
      d="M 10 4 L 74 4 L 42 52 Z"
      fill={color.replace(/[\d.]+\)$/, '0.08)')}
      stroke={color}
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <circle
      cx="42"
      cy="60"
      r="6"
      fill={color.replace(/[\d.]+\)$/, '0.08)')}
      stroke={color}
      strokeWidth="2.5"
    />
  </svg>
)
