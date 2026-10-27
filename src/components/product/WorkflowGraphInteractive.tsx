"use client";

import { useState } from "react";
import { Play, Pause, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WorkflowGraphSvg, NODE_WIDTH, NODE_HEIGHT } from "./WorkflowGraphSvg";
import type { WorkflowGraph } from "@/types/domain";

interface NodeDoc {
  name: string;
  purpose: string;
}

const WALKTHROUGH_STEP_MS = 900;

export function WorkflowGraphInteractive({ graph, nodeDocs }: { graph: WorkflowGraph; nodeDocs: NodeDoc[] }) {
  const [zoom, setZoom] = useState(1);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const maxX = Math.max(...graph.nodes.map((n) => n.x)) + NODE_WIDTH + 40;
  const maxY = Math.max(...graph.nodes.map((n) => n.y)) + NODE_HEIGHT + 40;

  function play() {
    setPlaying(true);
    setActiveIndex(0);
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      if (i >= graph.nodes.length) {
        clearInterval(interval);
        setPlaying(false);
        setActiveIndex(null);
        return;
      }
      setActiveIndex(i);
    }, WALKTHROUGH_STEP_MS);
  }

  function scrollToNode(index: number) {
    const row = document.getElementById(`node-row-${index}`);
    row?.scrollIntoView({ behavior: "smooth", block: "center" });
    row?.classList.add("bg-violet-50");
    setTimeout(() => row?.classList.remove("bg-violet-50"), 1500);
  }

  const displayIndex = activeIndex ?? hoveredIndex;
  const displayNode = displayIndex !== null ? graph.nodes[displayIndex] : null;
  const displayDoc = displayIndex !== null ? nodeDocs[displayIndex] : null;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary-outline" onClick={play} disabled={playing}>
          {playing ? <Pause aria-hidden="true" size={14} /> : <Play aria-hidden="true" size={14} />}
          {playing ? "Playing…" : "Play walkthrough"}
        </Button>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
            className="rounded-lg p-1.5 hover:bg-surface"
          >
            <ZoomOut aria-hidden="true" size={16} />
          </button>
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => setZoom((z) => Math.min(1.6, z + 0.15))}
            className="rounded-lg p-1.5 hover:bg-surface"
          >
            <ZoomIn aria-hidden="true" size={16} />
          </button>
          <button
            type="button"
            aria-label="Fit"
            onClick={() => setZoom(1)}
            className="rounded-lg p-1.5 hover:bg-surface"
          >
            <Maximize2 aria-hidden="true" size={16} />
          </button>
        </div>
      </div>

      <div className="relative overflow-x-auto rounded-xl border border-line/70 bg-surface p-4">
        <div style={{ width: `${zoom * 100}%`, minWidth: "720px", position: "relative" }}>
          <WorkflowGraphSvg graph={graph} />

          {/* Invisible hit targets, positioned in the same coordinate space as
              the server-rendered SVG (percentage-based so they track the
              SVG's responsive scaling). */}
          {graph.nodes.map((node, index) => (
            <button
              key={node.id}
              type="button"
              aria-label={`${node.name}: ${nodeDocs[index]?.purpose ?? ""}`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onFocus={() => setHoveredIndex(index)}
              onBlur={() => setHoveredIndex(null)}
              onClick={() => scrollToNode(index)}
              className="absolute rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              style={{
                left: `${(node.x / maxX) * 100}%`,
                top: `${(node.y / maxY) * 100}%`,
                width: `${(NODE_WIDTH / maxX) * 100}%`,
                height: `${(NODE_HEIGHT / maxY) * 100}%`,
                outline:
                  activeIndex === index
                    ? "2px solid #8b5cf6"
                    : hoveredIndex === index
                      ? "2px solid #14b8a6"
                      : "none",
              }}
            />
          ))}
        </div>
      </div>

      {displayNode && displayDoc ? (
        <div className="mt-3 rounded-xl bg-violet-50 p-3 text-sm text-ink-2">
          <span className="font-semibold text-ink">{displayNode.name}:</span> {displayDoc.purpose}
        </div>
      ) : null}
    </div>
  );
}
