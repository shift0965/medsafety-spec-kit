// App state store. Every action calls a domain function; components never compute rules
// themselves. State is saved to localStorage so a reload keeps the demo (research R2).
import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from "react";
import type { AppState, Instant, RiskLevel } from "../domain/types";
import { resetDemo, tick } from "../domain/clock";
import { confirmDose, markUnsure, resolveDuplicateChoice, type DuplicateChoice } from "../domain/doses";
import { markAlertRead } from "../domain/alerts";
import { setMedicationSettings } from "../domain/medications";
import { setSafetyContact, setShared } from "../domain/consent";

const STORAGE_KEY = "medsafety-v1";

export type Action =
  | { type: "TICK"; now: Instant }
  | { type: "RESET" }
  | { type: "CONFIRM_DOSE"; doseId: string }
  | { type: "MARK_UNSURE"; doseId: string }
  | { type: "RESOLVE_DUPLICATE"; doseId: string; choice: DuplicateChoice }
  | { type: "MARK_ALERT_READ"; alertId: string }
  | { type: "SET_MEDICATION_SETTINGS"; medId: string; windowMinutes: number; riskLevel: RiskLevel }
  | { type: "SET_SAFETY_CONTACT"; enabled: boolean }
  | { type: "SET_SHARED"; medId: string; shared: boolean };

/** The real calendar date only seeds the demo day; all rules use the simulated clock. */
function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function apply(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "TICK":
      return tick(state, action.now);
    case "RESET":
      return resetDemo(today());
    case "CONFIRM_DOSE":
      return confirmDose(state, action.doseId).state;
    case "MARK_UNSURE":
      return markUnsure(state, action.doseId);
    case "RESOLVE_DUPLICATE":
      return resolveDuplicateChoice(state, action.doseId, action.choice);
    case "MARK_ALERT_READ":
      return markAlertRead(state, action.alertId);
    case "SET_MEDICATION_SETTINGS":
      return setMedicationSettings(state, action.medId, {
        windowMinutes: action.windowMinutes,
        riskLevel: action.riskLevel,
      });
    case "SET_SAFETY_CONTACT":
      return setSafetyContact(state, action.enabled);
    case "SET_SHARED":
      return setShared(state, action.medId, action.shared);
  }
}

function reducer(state: AppState, action: Action): AppState {
  try {
    return apply(state, action);
  } catch (err) {
    console.warn("[medsafety] action rejected", action, err);
    return state;
  }
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as AppState;
      if (saved && typeof saved.clock === "string" && Array.isArray(saved.doses)) return tick(saved, saved.clock);
    }
  } catch {
    // Storage unavailable or corrupt: fall back to the seed.
  }
  return resetDemo(today());
}

interface Store {
  state: AppState;
  dispatch: Dispatch<Action>;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore: the demo still works without persistence.
    }
  }, [state]);
  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside StoreProvider");
  return store;
}
