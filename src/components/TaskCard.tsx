"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Task, TaskStatus, VALID_STATUS_TRANSITIONS, STATUS_LABELS } from "@/types/task";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onMove: (taskId: number, newStatus: TaskStatus) => void;
  draggable?: boolean;
}

export default function TaskCard({
  task,
  onEdit,
  onDelete,
  onMove,
  draggable = true,
}: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: draggable ? `task-${task.id}` : `overlay-task-${task.id}`,
      data: { task },
      disabled: !draggable,
    });

  const [showActions, setShowActions] = useState(false);

  const style = {
    transform: CSS.Translate.toString(transform),
    touchAction: "none" as const,
  };

  const nextStatuses = VALID_STATUS_TRANSITIONS[task.status];
  const timeAgo = getRelativeTime(task.created_at);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative w-full bg-white rounded-2xl border-2 border-black p-4 sm:p-5
                  shadow-brutal hover:shadow-brutal-lg transition-shadow duration-200
                  ${isDragging ? "opacity-60 scale-100 rotate-3 z-50 shadow-brutal-lg" : ""}
                  ${draggable ? "cursor-grab active:cursor-grabbing" : "cursor-default"} flex flex-col gap-4`}
      {...(draggable ? listeners : {})}
      {...(draggable ? attributes : {})}
    >
      {/* Title + Actions */}
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-sm sm:text-[15px] font-bold text-black leading-snug flex-1 break-words pb-1">
          {task.title}
        </h4>
        <div className="flex gap-2 relative pointer-events-auto">
          {/* Action buttons appear on hover or when 3-dot menu is clicked */}
          <div className={`flex gap-1.5 transition-opacity ${showActions ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(task); setShowActions(false); }}
              className="w-7 h-7 flex items-center justify-center rounded-full border-2 border-transparent hover:border-black bg-gray-100 hover:bg-white transition-all cursor-pointer"
              title="Edit"
            >
              <svg className="w-3.5 h-3.5 text-black pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(task); setShowActions(false); }}
              className="w-7 h-7 flex items-center justify-center rounded-full border-2 border-transparent hover:border-black bg-gray-100 hover:bg-white text-red-500 transition-all cursor-pointer"
              title="Delete"
            >
              <svg className="w-3.5 h-3.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); setShowActions(!showActions); }}
            className={`w-7 h-7 flex items-center justify-center text-black rounded-full transition-colors cursor-pointer ${showActions ? "bg-gray-200" : "hover:bg-gray-100 opacity-60 hover:opacity-100"}`}
            title="More actions"
          >
             <svg className="w-5 h-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
             </svg>
          </button>
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-sm text-gray-600 font-medium leading-relaxed line-clamp-3">
          {task.description}
        </p>
      )}

      {/* Tags Row */}
      <div className="flex flex-wrap items-center gap-2">
         {/* Prioritize tag logic (just visual mock for the UI theme mapping) */}
         <div className={`px-2.5 py-1 text-[10px] font-bold rounded-full border border-black ${getPillColor(task.status, true, task.id)}`}>
           {task.id % 2 === 0 ? "High" : task.id % 3 === 0 ? "Medium" : "Low"}
         </div>
         <div className={`px-2.5 py-1 text-[10px] font-bold rounded-full border border-black ${getPillColor(task.status, false, task.id)}`}>
           {task.id % 2 !== 0 ? "On Track" : "At Risk"}
         </div>
      </div>

      {/* Mobile quick move actions */}
      {nextStatuses.length > 0 && (
        <div className="sm:hidden flex flex-col gap-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
            Quick Move
          </p>
          <div className="flex flex-wrap gap-2 pointer-events-auto">
            {nextStatuses.map((nextStatus) => (
              <button
                key={nextStatus}
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onMove(task.id, nextStatus);
                }}
                className={`px-3 py-1.5 rounded-full border-2 border-black text-xs font-bold shadow-brutal-sm active:shadow-none active:translate-y-1 active:translate-x-1 transition-all ${getMoveButtonColor(nextStatus)}`}
              >
                Move to {STATUS_LABELS[nextStatus]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer: Date and Users */}
      <div className="flex items-center justify-between pt-2 mt-auto gap-2">
        <div className="flex items-center gap-1.5 text-gray-500 font-semibold text-[11px] sm:text-xs">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span suppressHydrationWarning>{timeAgo}</span>
        </div>

        {/* Mock Avatars matching the design */}
        <div className="flex -space-x-2">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-[8px] font-bold text-blue-700">
            A
          </div>
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-white bg-green-100 flex items-center justify-center text-[8px] font-bold text-green-700">
            B
          </div>
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-600">
            2+
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to sprinkle the vibrant colors shown in the specific design across pills.
function getPillColor(status: TaskStatus, isFirst: boolean, seed: number) {
  const colors = ["bg-[#FDA4D4]", "bg-[#A8B8FE]", "bg-[#5EDA7F]", "bg-[#F5C77A]"];
  const select = (seed + (isFirst ? 0 : 1)) % colors.length;
  return colors[select];
}

function getMoveButtonColor(nextStatus: TaskStatus) {
  if (nextStatus === "in_progress") return "bg-[#A8B8FE] hover:bg-[#95A8FF] text-black";
  if (nextStatus === "completed") return "bg-[#5EDA7F] hover:bg-[#4DCE70] text-black";
  return "bg-white hover:bg-gray-100 text-black";
}

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d`;
  
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
