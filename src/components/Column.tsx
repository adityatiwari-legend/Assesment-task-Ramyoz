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
  { accent: string; bg: string; border: string; dot: string; dropHighlight: string; pillColor: string }
> = {
  pending: {
    accent: "text-black",
    bg: "bg-[#F8F9FA]/50",
    border: "border-transparent",
    dot: "bg-pending",
    dropHighlight: "bg-pending/20 border-pending border-2 border-dashed",
    pillColor: "bg-pending",
  },
  in_progress: {
    accent: "text-black",
    bg: "bg-[#F8F9FA]/50",
    border: "border-transparent",
    dot: "bg-in-progress",
    dropHighlight: "bg-in-progress/20 border-in-progress border-2 border-dashed",
    pillColor: "bg-in-progress",
  },
  completed: {
    accent: "text-black",
    bg: "bg-[#F8F9FA]/50",
    border: "border-transparent",
    dot: "bg-completed",
    dropHighlight: "bg-completed/20 border-completed border-2 border-dashed",
    pillColor: "bg-completed",
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
      className={`flex flex-col min-h-[500px] rounded-[32px] transition-all duration-300 relative
                  ${isOver ? styles.dropHighlight : `${styles.bg} ${styles.border}`}`}
    >
      {/* Column Header - Pills style */}
      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <div className={`px-4 py-1.5 rounded-full border-2 border-black font-bold text-sm ${styles.pillColor} shadow-brutal-sm`}>
            {STATUS_LABELS[status]}
          </div>
        </div>
        <div
          className="text-xs font-bold px-3 py-1.5 rounded-full
                       bg-white text-black border-2 border-black shadow-brutal-sm"
        >
          {tasks.length}
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 p-4 pt-1 space-y-4 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[250px] text-center opacity-60">
            <div className="w-16 h-16 bg-white border-2 border-black border-dashed rounded-full flex items-center justify-center mb-4">
               <svg className="w-6 h-6 text-black/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
               </svg>
            </div>
            <p className="text-sm font-bold text-black">No tasks here</p>
            <p className="text-xs text-black/60 mt-1 max-w-[150px]">
              {status === "pending"
                ? "Click the pink + button to create a task"
                : "Drag tasks here"}
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
