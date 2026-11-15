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
  | "duplicate"
  // V2: next dose withheld until Dr. Nguyen's advice (FR-008, FR-009), or skipped on her advice (FR-027)
  | "held"
  | "skipped";

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
  /** V2: when a held dose was released after its due time; its window counts from here (R13). */
  releasedAt: Instant | null;
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
  /** V2: open until Dr. Nguyen gives advice (FR-027). */
  status: "open" | "resolved";
  resolvedAt: Instant | null;
  /** V2: set by Harold's late-dose check (FR-015). */
  adviceRequestedAt: Instant | null;
  /** V2: "I already took it" (true) or "Ask Dr. Nguyen" (false). */
  takenBeforeRequest: boolean | null;
}

/** V2: fixed advice list (FR-025, team assumption). */
export type AdviceOption = "takeNow" | "skipNextDose" | "takeNextAsUsual" | "callMe";

export const ADVICE_TEXT: Record<AdviceOption, string> = {
  takeNow: "Take it now",
  skipNextDose: "Skip your next dose",
  takeNextAsUsual: "Take your next dose as usual",
  callMe: "Please call me",
};

export interface Advice {
  id: string;
  /** Exactly one advice per resolved flag. */
  flagId: string;
  option: AdviceOption;
  givenAt: Instant;
  /** Harold's notice shows until true (FR-026). */
  acknowledged: boolean;
}

export interface Alert {
  id: string;
  flagId: string;
  recipient: PersonId;
  urgency: "urgent" | "routine";
  contentLevel: "full" | "checkInOnly";
  /** V2: `adviceRequest` = urgent alert to Dr. Nguyen from FR-015. */
  kind: "flag" | "adviceRequest";
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
  advice: Advice[];
  consent: ConsentSettings;
}

export const DEFAULT_WINDOW_MINUTES = 60;
export const DEFAULT_RISK: RiskLevel = "high";
/** Early confirmation allowed up to 2 h before the due time (FR-003, team assumption). */
export const EARLY_CONFIRM_MINUTES = 120;
/** A tap within 6 h of the last confirmation opens the FR-009 prompt (team assumption). */
export const REPEAT_CHECK_MINUTES = 360;
