"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setUser } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, firstName, lastName }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data);
        router.push("/");
      } else {
        const err = await res.json();
        setError(err.error || "Registration failed");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EAE0FB] p-4 sm:p-6">
      <div className="w-full max-w-md bg-white border-4 border-black rounded-2xl p-6 sm:p-8 shadow-[8px_8px_0px_#000000]">
        <h1 className="text-2xl sm:text-3xl font-black mb-5 sm:mb-6 uppercase tracking-tight text-center">Register</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border-2 border-red-500 rounded-lg text-red-600 font-bold text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-black mb-1 uppercase">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-3 bg-white text-black border-2 border-black rounded-xl font-medium focus:outline-none focus:ring-4 focus:ring-[#CABDFF] transition-all"
                placeholder="John"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-black mb-1 uppercase">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-3 bg-white text-black border-2 border-black rounded-xl font-medium focus:outline-none focus:ring-4 focus:ring-[#CABDFF] transition-all"
                placeholder="Doe"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-black mb-1 uppercase">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-white text-black border-2 border-black rounded-xl font-medium focus:outline-none focus:ring-4 focus:ring-[#CABDFF] transition-all"
              placeholder="neo_hacker"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-black mb-1 uppercase">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white text-black border-2 border-black rounded-xl font-medium focus:outline-none focus:ring-4 focus:ring-[#CABDFF] transition-all"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 sm:py-4 px-6 bg-[#A1F6B6] hover:bg-[#8AF0A3] text-black font-bold uppercase tracking-widest rounded-xl border-2 border-black shadow-[4px_4px_0px_#000000] active:shadow-none active:translate-y-1 active:translate-x-1 transition-all disabled:opacity-50"
          >
            {isLoading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm font-medium">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:underline font-bold">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
