"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AccountSession } from "@/lib/app-database";
import { userRoles } from "@/lib/constants";
import { UserRole } from "@/lib/types";

type UserRoleContextValue = {
  role: UserRole;
  account: AccountSession | null;
  isHydrated: boolean;
  setRole: (role: UserRole) => void;
  setAccount: (account: AccountSession) => void;
  clearAccount: () => void;
};

const UserRoleContext = createContext<UserRoleContextValue | undefined>(undefined);
const ROLE_STORAGE_KEY = "boxin_user_role";
const ACCOUNT_STORAGE_KEY = "boxin_account_session";
const ROLE_STORAGE_EVENT = "boxin_user_role_change";
const validRoles: UserRole[] = [
  "unauthenticated",
  "free_creator",
  "paid_creator",
  "brand_subscriber",
  "admin",
];

function readStoredAccount() {
  if (typeof window === "undefined") {
    return null;
  }

  const savedAccount = window.localStorage.getItem(ACCOUNT_STORAGE_KEY);
  if (!savedAccount) {
    return null;
  }

  try {
    const account = JSON.parse(savedAccount) as AccountSession;
    if (account.id && account.email && validRoles.includes(account.role)) {
      return account;
    }
  } catch {
    return null;
  }

  return null;
}

function readStoredRole() {
  if (typeof window === "undefined") {
    return userRoles.UNAUTHENTICATED;
  }

  const account = readStoredAccount();
  if (account) {
    return account.role;
  }

  return userRoles.UNAUTHENTICATED;
}

export function UserRoleProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccountState] = useState<AccountSession | null>(null);
  const [role, setRoleState] = useState<UserRole>(userRoles.UNAUTHENTICATED);
  const [isHydrated, setIsHydrated] = useState(false);

  const syncFromStorage = useCallback(() => {
    const storedAccount = readStoredAccount();
    setAccountState(storedAccount);
    setRoleState(storedAccount?.role ?? readStoredRole());
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      syncFromStorage();
      setIsHydrated(true);
    });

    window.addEventListener("storage", syncFromStorage);
    window.addEventListener(ROLE_STORAGE_EVENT, syncFromStorage);

    return () => {
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener(ROLE_STORAGE_EVENT, syncFromStorage);
    };
  }, [syncFromStorage]);

  const setRole = useCallback((nextRole: UserRole) => {
    if (typeof window !== "undefined") {
      if (nextRole === "unauthenticated") {
        window.localStorage.removeItem(ACCOUNT_STORAGE_KEY);
        setAccountState(null);
      } else {
        const demoAccount: AccountSession = {
          id: `demo-${nextRole}`,
          name: nextRole === "brand_subscriber" ? "Brand Demo" : nextRole === "admin" ? "Ava Lim" : "EE-EAN",
          email: `${nextRole}@demo.boxin`,
          role: nextRole,
          talentType: nextRole === "brand_subscriber" || nextRole === "admin" ? "brand" : "model",
          creatorSlug: nextRole === "free_creator" || nextRole === "paid_creator" ? "ee-ean" : undefined,
        };
        window.localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(demoAccount));
        setAccountState(demoAccount);
      }
      window.localStorage.setItem(ROLE_STORAGE_KEY, nextRole);
      setRoleState(nextRole);
      window.dispatchEvent(new Event(ROLE_STORAGE_EVENT));
    }
  }, []);

  const setAccount = useCallback((nextAccount: AccountSession) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(nextAccount));
      window.localStorage.setItem(ROLE_STORAGE_KEY, nextAccount.role);
      setAccountState(nextAccount);
      setRoleState(nextAccount.role);
      window.dispatchEvent(new Event(ROLE_STORAGE_EVENT));
    }
  }, []);

  const clearAccount = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ACCOUNT_STORAGE_KEY);
      window.localStorage.setItem(ROLE_STORAGE_KEY, userRoles.UNAUTHENTICATED);
      setAccountState(null);
      setRoleState(userRoles.UNAUTHENTICATED);
      window.dispatchEvent(new Event(ROLE_STORAGE_EVENT));
    }
  }, []);

  const value = useMemo(
    () => ({ account, role, isHydrated, setRole, setAccount, clearAccount }),
    [account, clearAccount, isHydrated, role, setAccount, setRole],
  );
  return <UserRoleContext.Provider value={value}>{children}</UserRoleContext.Provider>;
}

export function useUserRole() {
  const context = useContext(UserRoleContext);
  if (!context) {
    throw new Error("useUserRole must be used inside UserRoleProvider");
  }
  return context;
}
