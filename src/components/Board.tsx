"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  CreateTaskPayload,
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
import { useAuth } from "@/components/AuthProvider";

interface BoardProps {
  initialTasks: Task[];
}

function createOperationId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function Board({ initialTasks }: BoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [showBoardMenu, setShowBoardMenu] = useState(false);

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const { user, loading: authLoading, logout } = useAuth();
  const taskOperationsRef = useRef<Map<number, string>>(new Map());
  const isHandlingUnauthorizedRef = useRef(false);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
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
      arr.sort((a, b) => 
        sortOrder === "newest" 
          ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    );
    return groups;
  }, [filteredTasks, sortOrder]);

  const beginTaskOperation = useCallback((taskId: number): string => {
    const operationId = createOperationId();
    taskOperationsRef.current.set(taskId, operationId);
    return operationId;
  }, []);

  const isTaskOperationActive = useCallback(
    (taskId: number, operationId: string): boolean => {
      return taskOperationsRef.current.get(taskId) === operationId;
    },
    []
  );

  const finishTaskOperation = useCallback((taskId: number, operationId: string) => {
    if (taskOperationsRef.current.get(taskId) === operationId) {
      taskOperationsRef.current.delete(taskId);
    }
  }, []);

  const handleUnauthorized = useCallback(async () => {
    if (isHandlingUnauthorizedRef.current) return;

    isHandlingUnauthorizedRef.current = true;
    showToast("Session expired. Please log in again.", "error");

    try {
      await logout();
    } catch {
      window.location.href = "/login";
    } finally {
      isHandlingUnauthorizedRef.current = false;
    }
  }, [logout]);

  const fetchTasks = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/tasks");

      if (res.status === 401) {
        await handleUnauthorized();
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to fetch");
      }

      const data: Task[] = await res.json();
      setTasks(data);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to refresh tasks",
        "error"
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [handleUnauthorized]);

  const handleCreate = useCallback(
    async (payload: CreateTaskPayload) => {
      const nowIso = new Date().toISOString();
      const tempId = -Date.now();
      const optimisticTask: Task = {
        id: tempId,
        title: payload.title,
        description: payload.description ?? null,
        status: "pending",
        created_at: nowIso,
        updated_at: nowIso,
      };

      setTasks((prev) => [optimisticTask, ...prev]);

      try {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.status === 401) {
          setTasks((prev) => prev.filter((task) => task.id !== tempId));
          await handleUnauthorized();
          throw new Error("Session expired. Please log in again.");
        }

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || "Failed to create task");
        }

        const createdTask: Task = await res.json();
        setTasks((prev) =>
          prev.map((task) => (task.id === tempId ? createdTask : task))
        );
        showToast("Task created", "success");
      } catch (err) {
        setTasks((prev) => prev.filter((task) => task.id !== tempId));
        throw err instanceof Error ? err : new Error("Failed to create task");
      }
    },
    [handleUnauthorized]
  );

  const handleMove = useCallback(
    async (taskId: number, newStatus: TaskStatus) => {
      const operationId = beginTaskOperation(taskId);
      let previousStatus: TaskStatus | null = null;
      let taskExists = false;

      setTasks((prev) => {
        const task = prev.find((t) => t.id === taskId);
        if (!task) return prev;

        taskExists = true;
        previousStatus = task.status;

        if (task.status === newStatus) return prev;

        return prev.map((t) =>
          t.id === taskId ? { ...t, status: newStatus } : t
        );
      });

      if (!taskExists || previousStatus === null || previousStatus === newStatus) {
        finishTaskOperation(taskId, operationId);
        return;
      }

      try {
        const res = await fetch(`/api/tasks/${taskId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });

        if (res.status === 401) {
          if (isTaskOperationActive(taskId, operationId)) {
            setTasks((prev) =>
              prev.map((t) =>
                t.id === taskId ? { ...t, status: previousStatus as TaskStatus } : t
              )
            );
          }
          await handleUnauthorized();
          return;
        }

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data.error || "Failed to move task");
        }

        const updated: Task = await res.json();

        if (!isTaskOperationActive(taskId, operationId)) return;

        setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      } catch (err) {
        if (isTaskOperationActive(taskId, operationId)) {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === taskId ? { ...t, status: previousStatus as TaskStatus } : t
            )
          );
        }

        showToast(err instanceof Error ? err.message : "Failed to move task", "error");
      } finally {
        finishTaskOperation(taskId, operationId);
      }
    },
    [
      beginTaskOperation,
      finishTaskOperation,
      handleUnauthorized,
      isTaskOperationActive,
    ]
  );

  const handleEdit = useCallback(
    async (taskId: number, title: string, description: string) => {
      const operationId = beginTaskOperation(taskId);
      let previousTask: Pick<Task, "title" | "description"> | null = null;
      let taskExists = false;

      setTasks((prev) => {
        const task = prev.find((t) => t.id === taskId);
        if (!task) return prev;

        taskExists = true;
        previousTask = { title: task.title, description: task.description };

        return prev.map((t) =>
          t.id === taskId
            ? { ...t, title, description: description || null }
            : t
        );
      });

      if (!taskExists || !previousTask) {
        finishTaskOperation(taskId, operationId);
        throw new Error("Task not found");
      }

      try {
        const res = await fetch(`/api/tasks/${taskId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description }),
        });

        if (res.status === 401) {
          if (isTaskOperationActive(taskId, operationId)) {
            setTasks((prev) =>
              prev.map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      title: previousTask!.title,
                      description: previousTask!.description,
                    }
                  : t
              )
            );
          }
          await handleUnauthorized();
          return;
        }

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || "Failed to update task");
        }

        const updated: Task = await res.json();

        if (!isTaskOperationActive(taskId, operationId)) return;

        setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
        showToast("Task updated", "success");
      } catch (err) {
        if (isTaskOperationActive(taskId, operationId)) {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    title: previousTask!.title,
                    description: previousTask!.description,
                  }
                : t
            )
          );
        }
        throw err instanceof Error ? err : new Error("Failed to update task");
      } finally {
        finishTaskOperation(taskId, operationId);
      }
    },
    [
      beginTaskOperation,
      finishTaskOperation,
      handleUnauthorized,
      isTaskOperationActive,
    ]
  );

  const handleDelete = useCallback(
    async (taskId: number) => {
      const operationId = beginTaskOperation(taskId);
      let removedTask: Task | null = null;
      let removedIndex = -1;

      setTasks((prev) => {
        removedIndex = prev.findIndex((t) => t.id === taskId);
        if (removedIndex === -1) return prev;

        removedTask = prev[removedIndex];
        return prev.filter((t) => t.id !== taskId);
      });

      if (!removedTask || removedIndex < 0) {
        finishTaskOperation(taskId, operationId);
        return;
      }

      try {
        const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });

        if (res.status === 401) {
          if (isTaskOperationActive(taskId, operationId)) {
            setTasks((prev) => {
              const exists = prev.some((t) => t.id === removedTask!.id);
              if (exists) return prev;

              const next = [...prev];
              next.splice(Math.min(removedIndex, next.length), 0, removedTask!);
              return next;
            });
          }
          await handleUnauthorized();
          return;
        }

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || "Failed to delete task");
        }

        showToast("Task deleted", "success");
      } catch (err) {
        if (isTaskOperationActive(taskId, operationId)) {
          setTasks((prev) => {
            const exists = prev.some((t) => t.id === removedTask!.id);
            if (exists) return prev;

            const next = [...prev];
            next.splice(Math.min(removedIndex, next.length), 0, removedTask!);
            return next;
          });
        }

        showToast(
          err instanceof Error ? err.message : "Failed to delete task",
          "error"
        );
      } finally {
        finishTaskOperation(taskId, operationId);
      }
    },
    [
      beginTaskOperation,
      finishTaskOperation,
      handleUnauthorized,
      isTaskOperationActive,
    ]
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
          <header className="sticky top-0 z-30 pt-4 sm:pt-8 pb-3 sm:pb-4 bg-[#EAE0FB]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6">
                
                {/* Logo / Title */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#FDA4D4] border-2 border-black flex items-center justify-center shadow-brutal">
                    <svg className="w-6 h-6 text-black" fill="none" strokeWidth={2.5} stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="18" height="18" rx="4" />
                      <line x1="9" y1="3" x2="9" y2="21" />
                    </svg>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-black">
                    Mini Kanban Board
                  </h1>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full lg:w-auto">
                  <SearchBar value={searchQuery} onChange={setSearchQuery} />
                  
                  <div className="flex items-center justify-between sm:justify-start gap-3">
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
                    <div className="relative">
                      <button
                        onClick={() => setShowBoardMenu(!showBoardMenu)}
                        className={`w-12 h-12 flex-shrink-0 rounded-full border-2 border-black 
                                   hover:bg-gray-100 flex items-center justify-center shadow-brutal-sm
                                   active:translate-y-1 active:translate-x-1 active:shadow-none transition-all cursor-pointer
                                   ${showBoardMenu ? 'bg-gray-200' : 'bg-white'}`}
                      >
                        <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                      
                      {showBoardMenu && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowBoardMenu(false)}></div>
                          <div className="absolute right-0 mt-3 w-52 sm:w-56 bg-white border-2 border-black rounded-2xl shadow-brutal z-50 overflow-hidden animate-in slide-in-from-top-2 duration-150">
                            <div className="px-4 py-2 bg-gray-100 border-b-2 border-black text-xs font-bold text-gray-500 uppercase tracking-widest">
                              Board Settings
                            </div>
                            <div className="p-2 space-y-1">
                              <button
                                onClick={() => { setSortOrder("newest"); setShowBoardMenu(false); }}
                                className={`w-full text-left px-4 py-2 font-bold rounded-xl transition-colors flex items-center justify-between ${sortOrder === "newest" ? "bg-[#A1F6B6]" : "hover:bg-gray-100"}`}
                              >
                                Sort: Newest First
                                {sortOrder === "newest" && <span className="text-xl leading-none">✓</span>}
                              </button>
                              <button
                                onClick={() => { setSortOrder("oldest"); setShowBoardMenu(false); }}
                                className={`w-full text-left px-4 py-2 font-bold rounded-xl transition-colors flex items-center justify-between ${sortOrder === "oldest" ? "bg-[#A1F6B6]" : "hover:bg-gray-100"}`}
                              >
                                Sort: Oldest First
                                {sortOrder === "oldest" && <span className="text-xl leading-none">✓</span>}
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {authLoading ? (
                    <div className="flex w-full sm:w-auto items-center gap-2 px-4 py-2 bg-white border-2 border-black rounded-full shadow-brutal-sm font-bold animate-pulse">
                      Checking session...
                    </div>
                  ) : user ? (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:ml-2 sm:pl-4 sm:border-l-2 sm:border-black w-full sm:w-auto">
                      <div className="flex w-full sm:w-auto items-center gap-2 px-4 py-2 bg-white border-2 border-black rounded-full shadow-brutal-sm font-bold truncate max-w-full sm:max-w-[170px]">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0"></div>
                        <span className="truncate">{user.username}</span>
                      </div>
                      <button
                        onClick={logout}
                        className="w-full sm:w-auto px-4 py-2 border-2 border-black bg-[#FDA4D4] hover:bg-[#F970B5] text-black font-bold uppercase tracking-wide rounded-full shadow-brutal-sm active:translate-y-1 active:translate-x-1 active:shadow-none transition-all cursor-pointer whitespace-nowrap"
                      >
                        Logout
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28 sm:pb-32">
            {searchQuery && filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 sm:py-20 bg-white border-2 border-black rounded-3xl shadow-brutal">
                <p className="text-xl font-bold text-black">No tasks found</p>
                <button onClick={() => setSearchQuery("")} className="mt-4 px-6 py-2 bg-black text-white rounded-full font-bold">Clear search</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
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

      <TaskForm onCreateTask={handleCreate} />

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
