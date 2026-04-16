import { NextRequest, NextResponse } from "next/server";
import { pool, initializeDatabase } from "@/lib/db";
import { Task, CreateTaskPayload } from "@/types/task";

/**
 * GET /api/tasks
 * Returns all tasks ordered by creation date (newest first).
 */
export async function GET() {
  try {
    await initializeDatabase();

    const result = await pool.query<Task>(
      "SELECT * FROM tasks ORDER BY created_at DESC"
    );

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks
 * Creates a new task with status "pending".
 * Body: { title: string, description?: string }
 */
export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();

    const body: CreateTaskPayload = await request.json();

    // Validate required field
    if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json(
        { error: "Title is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    const title = body.title.trim();
    const description = body.description?.trim() || null;
    const tags = body.tags || [];

    const result = await pool.query<Task>(
      `INSERT INTO tasks (title, description, status, tags)
       VALUES ($1, $2, 'pending', $3)
       RETURNING *`,
      [title, description, tags]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
