import { NextRequest, NextResponse } from "next/server";
import { pool, initializeDatabase } from "@/lib/db";
import bcrypt from "bcryptjs";
import { setSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    const result = await pool.query("SELECT id, username, password_hash FROM users WHERE username = $1", [username]);
    const user = result.rows[0];

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await setSession(user.id, user.username);

    return NextResponse.json({ id: user.id, username: user.username }, { status: 200 });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
