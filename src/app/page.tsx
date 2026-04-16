import { pool, initializeDatabase } from "@/lib/db";
import { Task } from "@/types/task";
import Board from "@/components/Board";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

// Server Component — fetches initial data at request time
export const dynamic = "force-dynamic";

export default async function Home() {
  let tasks: Task[] = [];
  let fetchError: string | null = null;

  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  try {
    await initializeDatabase();

    const result = await pool.query<Task>(
      "SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC",
      [session.userId]
    );
    tasks = result.rows;
  } catch (err) {
    console.error("Failed to fetch tasks on server:", err);
    fetchError =
      "Could not connect to the database. Make sure PostgreSQL is running and DATABASE_URL is configured in .env.local";
  }

  if (fetchError) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen p-6">
        <div className="max-w-md w-full rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
            <svg
              className="w-7 h-7 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-red-300">
            Database Connection Failed
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">{fetchError}</p>
          <div className="bg-slate-800/60 rounded-lg p-4 text-left">
            <p className="text-xs text-slate-500 font-mono">
              DATABASE_URL=postgresql://user:pass@localhost:5432/kanban
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <Board initialTasks={tasks} />;
}
