import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabase";
import type { AppUser, Role } from "../types";

interface AuthContextType {
  user: AppUser | null;
  setUser: (u: AppUser | null) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const m = session.user.user_metadata;
        const role: Role = (m?.role as Role) ?? "family";
        await supabase.from("profiles").upsert(
          {
            id: session.user.id,
            email: session.user.email,
            full_name: m?.full_name ?? session.user.email,
            role,
            verified: m?.verified ?? false,
            suspended: false,
          },
          { onConflict: "id", ignoreDuplicates: true }
        );
        setUser({
          id: session.user.id,
          email: session.user.email!,
          role,
          full_name: m?.full_name ?? "User",
          verified: m?.verified,
        });
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) setUser(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
