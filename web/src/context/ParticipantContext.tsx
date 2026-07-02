import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Participant } from "../types";

interface ParticipantContextValue {
  participant: Participant | null;
  login: (participant: Participant) => void;
  logout: () => void;
}

const ParticipantContext = createContext<ParticipantContextValue | null>(null);

const STORAGE_KEY = "bolao.participant";

export function ParticipantProvider({ children }: { children: ReactNode }) {
  const [participant, setParticipant] = useState<Participant | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setParticipant(JSON.parse(raw));
  }, []);

  function login(created: Participant) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(created));
    setParticipant(created);
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setParticipant(null);
  }

  return <ParticipantContext.Provider value={{ participant, login, logout }}>{children}</ParticipantContext.Provider>;
}

export function useParticipant() {
  const ctx = useContext(ParticipantContext);
  if (!ctx) throw new Error("useParticipant deve ser usado dentro de ParticipantProvider");
  return ctx;
}
