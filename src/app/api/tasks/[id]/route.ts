import { NextRequest, NextResponse } from "next/server";
import { pool, initializeDatabase } from "@/lib/db";
import {
  Task,
  TaskStatus,
  UpdateTaskPayload,
  VALID_STATUS_TRANSITIONS,
} from "@/types/task";

// Allowed status values for runtime validation
const VALID_STATUSES: TaskStatus[] = ["pending", "in_progress", "completed"];

/**
 * PUT /api/tasks/[id]
 * Updates a task's title, description, and/or status.
 * Enforces valid status transitions.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();

    const { id } = await params;
    const taskId = parseInt(id, 10);

    if (isNaN(taskId)) {
      return NextResponse.json(
        { error: "Invalid task ID" },
        { status: 400 }
      );
    }

    const body: UpdateTaskPayload = await request.json();

    // Fetch the current task to validate status transitions
    const existing = await pool.query<Task>(
      "SELECT * FROM tasks WHERE id = $1",
      [taskId]
    );

    if (existing.rows.length === 0) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    const currentTask = existing.rows[0];

    // Validate status transition if status is being changed
    if (body.status) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
          { status: 400 }
        );
      }

      const allowedNext = VALID_STATUS_TRANSITIONS[currentTask.status];
      if (body.status !== currentTask.status && !allowedNext.includes(body.status)) {
        return NextResponse.json(
          {
            error: `Cannot transition from "${currentTask.status}" to "${body.status}". Allowed: ${allowedNext.length ? allowedNext.join(", ") : "none (terminal state)"}`,
          },
          { status: 422 }
        );
      }
    }

    // Validate title if provided
    if (body.title !== undefined && (typeof body.title !== "string" || !body.title.trim())) {
      return NextResponse.json(
        { error: "Title must be a non-empty string" },
        { status: 400 }
      );
    }

    // Build dynamic UPDATE query based on provided fields
    const updates: string[] = [];
    const values: (string | null)[] = [];
    let paramIndex = 1;

    if (body.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(body.title.trim());
    }

    if (body.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(body.description?.trim() || null);
    }

    if (body.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(body.status);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    values.push(String(taskId));
    const query = `UPDATE tasks SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`;

    const result = await pool.query<Task>(query, values);

    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (error) {
    console.error("PUT /api/tasks/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tasks/[id]
 * Permanently removes a task from the database.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();

    const { id } = await params;
    const taskId = parseInt(id, 10);

    if (isNaN(taskId)) {
      return NextResponse.json(
        { error: "Invalid task ID" },
        { status: 400 }
      );
    }

    const result = await pool.query<Task>(
      "DELETE FROM tasks WHERE id = $1 RETURNING *",
      [taskId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Task deleted", task: result.rows[0] },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/tasks/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
