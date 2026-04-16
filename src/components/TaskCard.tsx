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

  // Format relative time
  const timeAgo = getRelativeTime(task.created_at);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-xl border border-border-custom bg-surface
                  p-4 space-y-3
                  hover:border-border-hover hover:bg-surface-hover
                  transition-all duration-200
                  ${isDragging ? "opacity-40 scale-95 rotate-2" : ""}
                  cursor-grab active:cursor-grabbing`}
      {...listeners}
      {...attributes}
    >
      {/* Title + Actions row */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-foreground leading-snug flex-1 break-words">
          {task.title}
        </h4>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            id={`edit-task-${task.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            className="p-1.5 rounded-lg hover:bg-slate-700/60 text-slate-400 hover:text-blue-400
                       transition-colors cursor-pointer"
            title="Edit task"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            id={`delete-task-${task.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task);
            }}
            className="p-1.5 rounded-lg hover:bg-slate-700/60 text-slate-400 hover:text-red-400
                       transition-colors cursor-pointer"
            title="Delete task"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
          {task.description}
        </p>
      )}

      {/* Footer: time + move action */}
      <div className="flex items-center justify-between pt-1 border-t border-border-custom">
        <span suppressHydrationWarning className="text-[10px] text-slate-500 font-mono">{timeAgo}</span>

        {nextStatuses.length > 0 && (
          <div className="flex gap-1">
            {nextStatuses.map((status) => (
              <button
                key={status}
                id={`move-task-${task.id}-to-${status}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onMove(task.id, status);
                }}
                className={`text-[10px] font-medium px-2 py-1 rounded-md
                           transition-all duration-200 cursor-pointer
                           ${getStatusButtonStyle(status)}`}
              >
                → {STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getStatusButtonStyle(status: TaskStatus): string {
  switch (status) {
    case "in_progress":
      return "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20";
    case "completed":
      return "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20";
    default:
      return "bg-slate-500/10 text-slate-400 hover:bg-slate-500/20";
  }
}

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}
