// Mock seed data (data-model.md "Seed data"). No real patient data (Constitution V).
import type { AppState } from "./types";
import { atTime } from "./time";

/** `day` is "YYYY-MM-DD"; the caller supplies it so the domain never reads the device clock. */
export function createSeedState(day: string): AppState {
  return {
    clock: atTime(day, "06:45"),
    medications: [
      { id: "warfarin", name: "Warfarin", scheduleTimes: ["08:00"], windowMinutes: 60, riskLevel: "high", sharedWithRachel: false },
      { id: "atorvastatin", name: "Atorvastatin", scheduleTimes: ["20:00"], windowMinutes: 120, riskLevel: "low", sharedWithRachel: false },
      { id: "levothyroxine", name: "Levothyroxine", scheduleTimes: ["07:00"], windowMinutes: 30, riskLevel: "low", sharedWithRachel: false },
      { id: "metoprolol", name: "Metoprolol", scheduleTimes: ["08:00", "20:00"], windowMinutes: null, riskLevel: null, sharedWithRachel: false },
    ],
    doses: [],
    flags: [],
    alerts: [],
    advice: [],
    consent: { rachelIsSafetyContact: false },
  };
}
