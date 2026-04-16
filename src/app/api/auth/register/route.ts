import { NextRequest, NextResponse } from "next/server";
import { pool, initializeDatabase } from "@/lib/db";
import bcrypt from "bcryptjs";
import { setSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    const { username, password, firstName, lastName } = await request.json();

    if (!username || !password || typeof username !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    if (!firstName || !lastName || typeof firstName !== "string" || typeof lastName !== "string") {
      return NextResponse.json({ error: "First name and last name are required" }, { status: 400 });
    }

    if (username.length < 3 || password.length < 6) {
      return NextResponse.json({ error: "Username must be at least 3 characters and password at least 6 characters" }, { status: 400 });
    }

    // Check if user exists
    const existing = await pool.query("SELECT id FROM users WHERE username = $1", [username]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (username, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id, username, first_name, last_name",
      [username, passwordHash, firstName, lastName]
    );

    const user = result.rows[0];

    // Set session
    await setSession(user.id, user.username);

    return NextResponse.json({ id: user.id, username: user.username }, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
