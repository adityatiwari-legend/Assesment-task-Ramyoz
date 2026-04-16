"use client";

import { useDroppable } from "@dnd-kit/core";
import { Task, TaskStatus, STATUS_LABELS } from "@/types/task";
import TaskCard from "./TaskCard";

interface ColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onMove: (taskId: number, newStatus: TaskStatus) => void;
}

const COLUMN_STYLES: Record<
  TaskStatus,
  { accent: string; bg: string; border: string; dot: string; dropHighlight: string }
> = {
  pending: {
    accent: "text-pending",
    bg: "bg-pending-bg",
    border: "border-pending-border",
    dot: "bg-amber-400",
    dropHighlight: "border-amber-400/40 bg-amber-400/5",
  },
  in_progress: {
    accent: "text-in-progress",
    bg: "bg-in-progress-bg",
    border: "border-in-progress-border",
    dot: "bg-blue-400",
    dropHighlight: "border-blue-400/40 bg-blue-400/5",
  },
  completed: {
    accent: "text-completed",
    bg: "bg-completed-bg",
    border: "border-completed-border",
    dot: "bg-emerald-400",
    dropHighlight: "border-emerald-400/40 bg-emerald-400/5",
  },
};

export default function Column({ status, tasks, onEdit, onDelete, onMove }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
    data: { status },
  });

  const styles = COLUMN_STYLES[status];

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-h-[400px] rounded-2xl border transition-all duration-300
                  ${isOver ? styles.dropHighlight : `${styles.bg} ${styles.border}`}`}
    >
      {/* Column Header */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-inherit">
        <span className={`w-2.5 h-2.5 rounded-full ${styles.dot} shadow-sm`} />
        <h2 className={`text-sm font-bold uppercase tracking-wider ${styles.accent}`}>
          {STATUS_LABELS[status]}
        </h2>
        <span
          className="ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full
                       bg-slate-800 text-slate-400 border border-border-custom"
        >
          {tasks.length}
        </span>
      </div>

      {/* Task List */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center opacity-50">
            <svg
              className="w-10 h-10 text-slate-600 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-xs text-slate-500 font-medium">No tasks yet</p>
            <p className="text-[10px] text-slate-600 mt-1">
              {status === "pending"
                ? "Create a new task to get started"
                : "Drag tasks here or use the move button"}
            </p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              onMove={onMove}
            />
          ))
        )}
      </div>
    </div>
  );
}
