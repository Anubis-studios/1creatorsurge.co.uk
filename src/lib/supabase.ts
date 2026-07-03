/**
 * Simulated Supabase integration file.
 * Routes requests to our backend container server `/api` routes,
 * ensuring high fidelity, reliable, in-browser execution within the AI Studio preview environment.
 */

export const VITE_SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || "https://mock-supabase.supabase.co";
export const VITE_SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "mock-anon-key";

// Simulated Supabase client for local access
export const supabase = {
  auth: {
    getUser: async () => {
      const stored = localStorage.getItem("surgebox_user_id") || "";
      return { data: { user: { id: stored, email: "user@example.com" } }, error: null };
    },
    signOut: async () => {
      localStorage.removeItem("surgebox_user_id");
      return { error: null };
    }
  }
};

/**
 * Standard client-facing wrapper that interacts with our backend Edge services
 */
export async function callFunction<T = any>(path: string, body: Record<string, any>): Promise<T> {
  const targetUrl = `/api/${path}`;
  
  const response = await fetch(targetUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${VITE_SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Network request failed" }));
    throw new Error(err.error || `HTTP error ${response.status}`);
  }

  return response.json() as Promise<T>;
}
