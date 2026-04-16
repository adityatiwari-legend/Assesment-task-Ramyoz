"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Task, TaskStatus, VALID_STATUS_TRANSITIONS, STATUS_LABELS } from "@/types/task";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onMove: (taskId: number, newStatus: TaskStatus) => void;
}

export default function TaskCard({ task, onEdit, onDelete, onMove }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `task-${task.id}`,
      data: { task },
    });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const nextStatuses = VALID_STATUS_TRANSITIONS[task.status];
  const timeAgo = getRelativeTime(task.created_at);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative w-full bg-white rounded-2xl border-2 border-black p-5
                  shadow-brutal hover:shadow-brutal-lg transition-shadow duration-200
                  ${isDragging ? "opacity-60 scale-100 rotate-3 z-50 shadow-brutal-lg" : ""}
                  cursor-grab active:cursor-grabbing flex flex-col gap-4`}
      {...listeners}
      {...attributes}
    >
      {/* Title + Actions */}
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-[15px] font-bold text-black leading-snug flex-1 break-words pb-1">
          {task.title}
        </h4>
        <div className="flex gap-2">
          {/* Action buttons appear on hover on desktop, always there on mobile */}
          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(task); }}
              className="w-7 h-7 flex items-center justify-center rounded-full border-2 border-transparent hover:border-black bg-gray-100 hover:bg-white transition-all pointer-events-auto"
              title="Edit"
            >
              <svg className="w-3.5 h-3.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(task); }}
              className="w-7 h-7 flex items-center justify-center rounded-full border-2 border-transparent hover:border-black bg-gray-100 hover:bg-white text-red-500 transition-all pointer-events-auto"
              title="Delete"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
          <div className="w-6 h-6 flex items-center justify-center text-black opacity-40">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
             </svg>
          </div>
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

      {/* Footer: Date and Users */}
      <div className="flex items-center justify-between pt-2 mt-auto">
        <div className="flex items-center gap-1.5 text-gray-500 font-semibold text-xs">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span suppressHydrationWarning>{timeAgo}</span>
        </div>

        {/* Mock Avatars matching the design */}
        <div className="flex -space-x-2">
          <img className="w-6 h-6 rounded-full border-2 border-white bg-blue-100" src={`https://api.dicebear.com/7.x/notionists/svg?seed=${task.id}A`} alt="user" />
          <img className="w-6 h-6 rounded-full border-2 border-white bg-green-100" src={`https://api.dicebear.com/7.x/notionists/svg?seed=${task.id}B`} alt="user" />
          <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-600">
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
