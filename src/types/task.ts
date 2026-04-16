// Task status enum matching the PostgreSQL enum type
export type TaskStatus = "pending" | "in_progress" | "completed";

// Database row shape returned from PostgreSQL
export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
}

// Payload for creating a new task (POST)
export interface CreateTaskPayload {
  title: string;
  description?: string;
}

// Payload for updating a task (PUT)
export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: TaskStatus;
}

// Valid status transitions (enforced server-side)
export const VALID_STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  pending: ["in_progress"],
  in_progress: ["completed"],
  completed: [],
};

// Column order for the Kanban board
export const COLUMN_ORDER: TaskStatus[] = [
  "pending",
  "in_progress",
  "completed",
];

// Human-readable labels
export const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};
