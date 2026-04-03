import type { NodeTypes } from 'reactflow'

import { OperatorNodeComponent, SignalNodeComponent } from './ExpressionBuilderNodes'

export const nodeTypes: NodeTypes = {
  operatorNode: OperatorNodeComponent,
  signalNode: SignalNodeComponent,
}
