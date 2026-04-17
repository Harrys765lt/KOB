"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { userRoles } from "@/lib/constants";
import { UserRole } from "@/lib/types";

type UserRoleContextValue = {
  role: UserRole;
  setRole: (role: UserRole) => void;
};

const UserRoleContext = createContext<UserRoleContextValue | undefined>(undefined);
const ROLE_STORAGE_KEY = "boxin_user_role";
const validRoles: UserRole[] = [
  "unauthenticated",
  "free_creator",
  "paid_creator",
  "brand_subscriber",
  "admin",
];

export function UserRoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(() => {
    if (typeof window === "undefined") {
      return userRoles.UNAUTHENTICATED;
    }
    const savedRole = window.localStorage.getItem(ROLE_STORAGE_KEY);
    if (savedRole && validRoles.includes(savedRole as UserRole)) {
      return savedRole as UserRole;
    }
    return userRoles.UNAUTHENTICATED;
  });

  const setRole = useCallback((nextRole: UserRole) => {
    setRoleState(nextRole);
    window.localStorage.setItem(ROLE_STORAGE_KEY, nextRole);
  }, []);

  const value = useMemo(() => ({ role, setRole }), [role, setRole]);
  return <UserRoleContext.Provider value={value}>{children}</UserRoleContext.Provider>;
}

export function useUserRole() {
  const context = useContext(UserRoleContext);
  if (!context) {
    throw new Error("useUserRole must be used inside UserRoleProvider");
  }
  return context;
}
