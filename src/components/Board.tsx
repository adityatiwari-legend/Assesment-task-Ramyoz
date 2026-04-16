"use client";

import { useState, useCallback, useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  Task,
  TaskStatus,
  COLUMN_ORDER,
  VALID_STATUS_TRANSITIONS,
} from "@/types/task";
import Column from "./Column";
import TaskForm from "./TaskForm";
import TaskCard from "./TaskCard";
import EditModal from "./EditModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import SearchBar from "./SearchBar";
import ToastContainer, { showToast } from "./ToastContainer";

interface BoardProps {
  initialTasks: Task[];
}

export default function Board({ initialTasks }: BoardProps) {
  // ----- Core State -----
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ----- Modal State -----
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  // ----- DnD State -----
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // ----- Derived: filtered & grouped tasks -----
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    const q = searchQuery.toLowerCase();
    return tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
    );
  }, [tasks, searchQuery]);

  const groupedTasks = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = {
      pending: [],
      in_progress: [],
      completed: [],
    };
    filteredTasks.forEach((t) => groups[t.status].push(t));
    // Sort each group by created_at descending
    Object.values(groups).forEach((arr) =>
      arr.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    );
    return groups;
  }, [filteredTasks]);

  // ----- API Helpers -----
  const fetchTasks = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error("Failed to fetch");
      const data: Task[] = await res.json();
      setTasks(data);
    } catch {
      showToast("Failed to refresh tasks", "error");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleMove = useCallback(
    async (taskId: number, newStatus: TaskStatus) => {
      // Optimistic update
      const prevTasks = [...tasks];
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );

      try {
        const res = await fetch(`/api/tasks/${taskId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to move task");
        }
        const updated: Task = await res.json();
        setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
        showToast(`Task moved to ${newStatus.replace("_", " ")}`, "success");
      } catch (err) {
        setTasks(prevTasks); // Revert
        showToast(
          err instanceof Error ? err.message : "Failed to move task",
          "error"
        );
      }
    },
    [tasks]
  );

  const handleEdit = useCallback(
    async (taskId: number, title: string, description: string) => {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update task");
      }
      const updated: Task = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      showToast("Task updated", "success");
    },
    []
  );

  const handleDelete = useCallback(
    async (taskId: number) => {
      // Optimistic removal
      const prevTasks = [...tasks];
      setTasks((prev) => prev.filter((t) => t.id !== taskId));

      try {
        const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete");
        showToast("Task deleted", "success");
      } catch {
        setTasks(prevTasks);
        showToast("Failed to delete task", "error");
      }
    },
    [tasks]
  );

  // ----- Drag & Drop Handlers -----
  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as Task | undefined;
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const draggedTask = active.data.current?.task as Task | undefined;
    if (!draggedTask) return;

    // Get the target column status from the droppable's data
    const targetStatus = over.data.current?.status as TaskStatus | undefined;
    if (!targetStatus || targetStatus === draggedTask.status) return;

    // Validate transition
    const allowed = VALID_STATUS_TRANSITIONS[draggedTask.status];
    if (!allowed.includes(targetStatus)) {
      showToast(
        `Cannot move from ${draggedTask.status.replace("_", " ")} to ${targetStatus.replace("_", " ")}`,
        "error"
      );
      return;
    }

    handleMove(draggedTask.id, targetStatus);
  };

  // ----- Task counts -----
  const totalTasks = tasks.length;

  return (
    <>
      <DndContext
        id="kanban-board"
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Header */}
          <header className="sticky top-0 z-30 border-b border-border-custom bg-background/80 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Title block */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                      />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-foreground tracking-tight">
                      Kanban Board
                    </h1>
                    <p className="text-xs text-slate-500">
                      {totalTasks} {totalTasks === 1 ? "task" : "tasks"} total
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 flex-wrap">
                  <SearchBar value={searchQuery} onChange={setSearchQuery} />
                  <button
                    id="refresh-tasks"
                    onClick={fetchTasks}
                    disabled={isRefreshing}
                    className="p-2.5 rounded-xl border border-border-custom bg-slate-800/60
                               hover:bg-slate-700/60 text-slate-400 hover:text-slate-200
                               disabled:opacity-50 transition-all duration-200 cursor-pointer"
                    title="Refresh tasks"
                  >
                    <svg
                      className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Task Form */}
              <div className="mt-4">
                <TaskForm onTaskCreated={fetchTasks} />
              </div>
            </div>
          </header>

          {/* Board Columns */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {searchQuery && filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <svg
                  className="w-16 h-16 text-slate-700 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <p className="text-slate-500 font-medium">
                  No tasks matching &quot;{searchQuery}&quot;
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-3 text-sm text-blue-400 hover:text-blue-300
                             transition-colors cursor-pointer"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {COLUMN_ORDER.map((status) => (
                  <Column
                    key={status}
                    status={status}
                    tasks={groupedTasks[status]}
                    onEdit={setEditingTask}
                    onDelete={setDeletingTask}
                    onMove={handleMove}
                  />
                ))}
              </div>
            )}
          </main>
        </div>

        {/* Drag Overlay — renders a ghost card while dragging */}
        <DragOverlay>
          {activeTask ? (
            <div className="drag-overlay">
              <TaskCard
                task={activeTask}
                onEdit={() => {}}
                onDelete={() => {}}
                onMove={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Modals */}
      {editingTask && (
        <EditModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={handleEdit}
        />
      )}

      {deletingTask && (
        <DeleteConfirmModal
          task={deletingTask}
          onClose={() => setDeletingTask(null)}
          onConfirm={handleDelete}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer />
    </>
  );
}
