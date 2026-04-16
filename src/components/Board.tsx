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
  STATUS_LABELS,
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
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

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
    Object.values(groups).forEach((arr) =>
      arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    );
    return groups;
  }, [filteredTasks]);

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
      const prevTasks = [...tasks];
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
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
      } catch (err) {
        setTasks(prevTasks);
        showToast(err instanceof Error ? err.message : "Failed to move task", "error");
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
    const targetStatus = over.data.current?.status as TaskStatus | undefined;
    if (!targetStatus || targetStatus === draggedTask.status) return;

    const allowed = VALID_STATUS_TRANSITIONS[draggedTask.status];
    if (!allowed.includes(targetStatus)) {
      showToast(`Cannot move to ${STATUS_LABELS[targetStatus]}`, "error");
      return;
    }
    handleMove(draggedTask.id, targetStatus);
  };

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
          {/* Brutalist Header matching "Task List" style from the design */}
          <header className="sticky top-0 z-30 pt-8 pb-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                
                {/* Logo / Title */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#FDA4D4] border-2 border-black flex items-center justify-center shadow-brutal">
                    <svg className="w-6 h-6 text-black" fill="none" strokeWidth={2.5} stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="18" height="18" rx="4" />
                      <line x1="9" y1="3" x2="9" y2="21" />
                    </svg>
                  </div>
                  <h1 className="text-3xl font-black tracking-tight text-black">
                    Task List
                  </h1>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <SearchBar value={searchQuery} onChange={setSearchQuery} />
                  
                  <button
                    onClick={fetchTasks}
                    disabled={isRefreshing}
                    className="w-12 h-12 flex-shrink-0 rounded-full border-2 border-black bg-white
                               hover:bg-gray-100 flex items-center justify-center shadow-brutal-sm
                               active:translate-y-1 active:translate-x-1 active:shadow-none transition-all cursor-pointer disabled:opacity-50"
                  >
                    <svg className={`w-5 h-5 text-black ${isRefreshing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <button
                    className="w-12 h-12 flex-shrink-0 rounded-full border-2 border-black bg-white
                               hover:bg-gray-100 flex items-center justify-center shadow-brutal-sm
                               active:translate-y-1 active:translate-x-1 active:shadow-none transition-all cursor-pointer"
                  >
                    <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
            {searchQuery && filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white border-2 border-black rounded-3xl shadow-brutal">
                <p className="text-xl font-bold text-black">No tasks found</p>
                <button onClick={() => setSearchQuery("")} className="mt-4 px-6 py-2 bg-black text-white rounded-full font-bold">Clear search</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {COLUMN_ORDER.map((status) => (
                  <Column key={status} status={status} tasks={groupedTasks[status]} onEdit={setEditingTask} onDelete={setDeletingTask} onMove={handleMove} />
                ))}
              </div>
            )}
          </main>
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="drag-overlay">
              <TaskCard task={activeTask} onEdit={() => {}} onDelete={() => {}} onMove={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskForm onTaskCreated={fetchTasks} />

      {editingTask && (
        <EditModal task={editingTask} onClose={() => setEditingTask(null)} onSave={handleEdit} />
      )}
      {deletingTask && (
        <DeleteConfirmModal task={deletingTask} onClose={() => setDeletingTask(null)} onConfirm={handleDelete} />
      )}
      <ToastContainer />
    </>
  );
}
