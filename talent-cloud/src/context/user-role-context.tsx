"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { userRoles } from "@/lib/constants";
import { UserRole } from "@/lib/types";

type UserRoleContextValue = {
  role: UserRole;
  setRole: (role: UserRole) => void;
};

const UserRoleContext = createContext<UserRoleContextValue | undefined>(undefined);

export function UserRoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>(userRoles.UNAUTHENTICATED);
  const value = useMemo(() => ({ role, setRole }), [role]);
  return <UserRoleContext.Provider value={value}>{children}</UserRoleContext.Provider>;
}

export function useUserRole() {
  const context = useContext(UserRoleContext);
  if (!context) {
    throw new Error("useUserRole must be used inside UserRoleProvider");
  }
  return context;
}
