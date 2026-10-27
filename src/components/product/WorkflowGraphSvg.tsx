import type { WorkflowGraph } from "@/types/domain";

const GROUP_COLOR: Record<WorkflowGraph["nodes"][number]["group"], string> = {
  trigger: "#e5484d",
  logic: "#94a3b8",
  ai: "#8b5cf6",
  data: "#14b8a6",
  output: "#334155",
};

const NODE_WIDTH = 176;
const NODE_HEIGHT = 60;

function edgePath(from: { x: number; y: number }, to: { x: number; y: number }): string {
  const fromX = from.x + NODE_WIDTH;
  const fromY = from.y + NODE_HEIGHT / 2;
  const toX = to.x;
  const toY = to.y + NODE_HEIGHT / 2;
  const midX = (fromX + toX) / 2;
  return `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
}

/**
 * Pure markup, no event handlers — this renders identically with
 * JavaScript disabled. `WorkflowGraphInteractive` layers hover/click/
 * walkthrough behavior on top using absolutely-positioned hit targets at
 * the same coordinates, rather than needing this component itself to be a
 * client component.
 */
export function WorkflowGraphSvg({ graph }: { graph: WorkflowGraph }) {
  const maxX = Math.max(...graph.nodes.map((n) => n.x)) + NODE_WIDTH + 40;
  const maxY = Math.max(...graph.nodes.map((n) => n.y)) + NODE_HEIGHT + 40;

  return (
    <svg viewBox={`0 0 ${maxX} ${maxY}`} className="h-auto w-full min-w-[720px]" role="img" aria-label="Workflow node graph">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#cbd5e1" />
        </marker>
      </defs>

      {graph.edges.map((edge, i) => {
        const from = graph.nodes.find((n) => n.id === edge.from);
        const to = graph.nodes.find((n) => n.id === edge.to);
        if (!from || !to) return null;
        return (
          <path
            key={i}
            d={edgePath(from, to)}
            stroke="#cbd5e1"
            strokeWidth={2}
            fill="none"
            markerEnd="url(#arrow)"
          />
        );
      })}

      {graph.nodes.map((node) => (
        <g key={node.id} data-node-id={node.id}>
          <rect
            x={node.x}
            y={node.y}
            width={NODE_WIDTH}
            height={NODE_HEIGHT}
            rx={12}
            fill="white"
            stroke="#e2e8f0"
          />
          <rect x={node.x} y={node.y} width={4} height={NODE_HEIGHT} rx={2} fill={GROUP_COLOR[node.group]} />
          <text x={node.x + 16} y={node.y + 26} fontSize={13} fontWeight={600} fill="#0f172a">
            {truncate(node.name, 20)}
          </text>
          <text x={node.x + 16} y={node.y + 44} fontSize={11} fill="#64748b">
            {truncate(node.type, 24)}
          </text>
        </g>
      ))}
    </svg>
  );
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export { NODE_WIDTH, NODE_HEIGHT };
