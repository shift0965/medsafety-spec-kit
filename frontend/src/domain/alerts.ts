// Alert routing by urgency and consent (contracts/domain-api.md "Alert routing").
import type { Alert, AppState, Flag, PersonId } from "./types";

function makeAlert(flag: Flag, recipient: PersonId, urgency: Alert["urgency"], contentLevel: Alert["contentLevel"]): Alert {
  return {
    id: `alert:${flag.id}:${recipient}`,
    flagId: flag.id,
    recipient,
    urgency,
    contentLevel,
    kind: "flag",
    createdAt: flag.raisedAt, // research R10: alerts appear in the same update as the flag
    read: false,
  };
}

// FR-016, FR-017, FR-021
export function routeFlag(state: AppState, flag: Flag): AppState {
  const alerts: Alert[] = [];
  if (flag.riskLevel === "high") {
    alerts.push(makeAlert(flag, "harold", "urgent", "full"));
    alerts.push(makeAlert(flag, "nguyen", "urgent", "full"));
    if (state.consent.rachelIsSafetyContact) {
      alerts.push(makeAlert(flag, "rachel", "urgent", "checkInOnly"));
    }
  } else {
    alerts.push(makeAlert(flag, "harold", "routine", "full"));
  }
  return { ...state, alerts: [...state.alerts, ...alerts] };
}

export function markAlertRead(state: AppState, alertId: string): AppState {
  return {
    ...state,
    alerts: state.alerts.map((a) => (a.id === alertId ? { ...a, read: true } : a)),
  };
}

export function unreadCount(state: AppState, recipient: PersonId): number {
  return state.alerts.filter((a) => a.recipient === recipient && !a.read).length;
}
