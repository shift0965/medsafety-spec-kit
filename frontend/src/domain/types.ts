// Entities from specs/001-dose-safety-alerts/data-model.md.
// Times are simulated-clock instants "YYYY-MM-DDTHH:MM" (see time.ts); never the device clock.

export type Instant = string;

export type PersonId = "harold" | "rachel" | "nguyen";

export type RiskLevel = "high" | "low";

export interface Medication {
  id: string;
  name: string;
  /** "HH:MM" due times, at least one per day. */
  scheduleTimes: string[];
  /** 5–240 when set; null → default 60 (FR-011). */
  windowMinutes: number | null;
  /** null → default "high" (FR-011). */
  riskLevel: RiskLevel | null;
  /** Default false (FR-019, FR-022). */
  sharedWithRachel: boolean;
}

export type DoseStatus =
  | "scheduled"
  | "due"
  | "taken"
  | "takenLate"
  | "unsure"
  | "missed"
  | "duplicate";

export interface Dose {
  /** `${medicationId}@${date}T${time}` */
  id: string;
  medicationId: string;
  dueAt: Instant;
  /** Snapshot taken when the dose leaves `scheduled`; null before that (FR-010, edge case). */
  windowMinutes: number | null;
  riskLevel: RiskLevel | null;
  status: DoseStatus;
  confirmations: Instant[];
  unsureAt: Instant | null;
  /** Set once, never re-set (FR-001). */
  reminderShownAt: Instant | null;
}

export type FlagReason = "missed" | "duplicate" | "unsure";

export interface Flag {
  id: string;
  doseId: string;
  reason: FlagReason;
  raisedAt: Instant;
  riskLevel: RiskLevel;
  /** e.g. "taken late at 09:15" (FR-015). */
  note: string | null;
}

export interface Alert {
  id: string;
  flagId: string;
  recipient: PersonId;
  urgency: "urgent" | "routine";
  contentLevel: "full" | "checkInOnly";
  createdAt: Instant;
  read: boolean;
}

export interface ConsentSettings {
  rachelIsSafetyContact: boolean;
}

export interface AppState {
  clock: Instant;
  medications: Medication[];
  doses: Dose[];
  flags: Flag[];
  alerts: Alert[];
  consent: ConsentSettings;
}

export const DEFAULT_WINDOW_MINUTES = 60;
export const DEFAULT_RISK: RiskLevel = "high";
/** Early confirmation allowed up to 2 h before the due time (FR-003, team assumption). */
export const EARLY_CONFIRM_MINUTES = 120;
/** A tap within 6 h of the last confirmation opens the FR-009 prompt (team assumption). */
export const REPEAT_CHECK_MINUTES = 360;
