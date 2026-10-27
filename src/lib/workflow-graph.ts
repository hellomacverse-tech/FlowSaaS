import type { WorkflowGraph } from "@/types/domain";

export interface NodeDocInput {
  name: string;
  type: string;
  purpose: string;
  credentialsNeeded: string | null;
  notes: string;
  group: "trigger" | "logic" | "ai" | "data" | "output";
}

const COLUMN_WIDTH = 220;
const ROW_HEIGHT = 100;
const NODES_PER_ROW = 4;

/**
 * Most FlowSaaS launch workflows are a mostly-linear chain (trigger →
 * a few processing/AI steps → one or two outputs), so a simple
 * left-to-right, wrapping grid reads clearly without needing a hand-placed
 * layout per workflow. Edges connect each node to the next in sequence.
 */
export function buildSequentialGraph(nodes: NodeDocInput[]): WorkflowGraph {
  const graphNodes = nodes.map((node, index) => {
    const row = Math.floor(index / NODES_PER_ROW);
    const col = index % NODES_PER_ROW;
    // Serpentine layout so the chain reads left-to-right, then right-to-left
    // on the next row, like text wrapping — avoids a long edge jumping back
    // across the whole width at each row break.
    const x = row % 2 === 0 ? col * COLUMN_WIDTH + 40 : (NODES_PER_ROW - 1 - col) * COLUMN_WIDTH + 40;
    const y = row * ROW_HEIGHT + 40;

    return {
      id: `n${index}`,
      name: node.name,
      type: node.type,
      group: node.group,
      x,
      y,
    };
  });

  const edges = graphNodes.slice(1).map((node, index) => ({
    from: graphNodes[index]!.id,
    to: node.id,
  }));

  return { nodes: graphNodes, edges };
}
