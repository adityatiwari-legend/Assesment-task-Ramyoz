import { JWTPayload, SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be configured in production");
}

const secretKey = process.env.JWT_SECRET ?? "dev_only_secret_change_me";
const key = new TextEncoder().encode(secretKey);

export interface SessionPayload extends JWTPayload {
    userId: number;
    username: string;
    expires: string;
}

function isSessionPayload(payload: JWTPayload): payload is SessionPayload {
    return (
        typeof payload.userId === "number" &&
        typeof payload.username === "string" &&
        typeof payload.expires === "string"
    );
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function decrypt(input: string): Promise<SessionPayload | null> {
    try {
        const { payload } = await jwtVerify(input, key, {
            algorithms: ["HS256"],
        });

        if (!isSessionPayload(payload)) {
            return null;
        }

        return payload;
    } catch {
        return null;
    }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return null;
  return await decrypt(session);
}

export async function setSession(userId: number, username: string) {
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const session = await encrypt({
        userId,
        username,
        expires: expires.toISOString(),
    });

    const cookieStore = await cookies();
    cookieStore.set("session", session, {
        expires,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    });
}

export async function clearSession() {
    const cookieStore = await cookies();
    cookieStore.set("session", "", { expires: new Date(0) });
}
