export const RETIREMENT_AGE = 65;
export const ANNUAL_LEAVE_DAYS = 20;

export const STAGES = ["applied", "screening", "interview", "offer", "rejected"];
export const LEAVE_TYPES = ["annual", "sick", "parental", "unpaid"];
export const EXIT_TYPES = ["retirement", "resignation", "termination"];

export const ONBOARDING = [
  "Sign employment contract",
  "Submit ID and tax documents",
  "Set up laptop and accounts",
  "Orientation and policy briefing",
  "Meet team and manager",
];
export const OFFBOARDING = [
  "Handover and knowledge transfer",
  "Return equipment and access cards",
  "Revoke system access",
  "Final pay and benefits settlement",
  "Exit interview",
];
export const RETIREMENT_EXTRA = "Pension and retirement benefits paperwork";

// shortcut: UTC dates, not company-local time; upgrade when users span time zones
export const today = () => new Date().toISOString().slice(0, 10);
export const retirementDate = (birth: string) =>
  `${Number(birth.slice(0, 4)) + RETIREMENT_AGE}${birth.slice(4)}`;
export const daysBetween = (a: string, b: string) =>
  Math.round((Date.parse(b) - Date.parse(a)) / 864e5) + 1;

export type Employee = {
  id: number; name: string; email: string; phone: string | null;
  department: string; position: string; salary: number;
  birth_date: string; hire_date: string; retirement_date: string;
  status: "onboarding" | "active" | "offboarding" | "exited";
  exit_type: string | null; exit_date: string | null;
};
export type Task = { id: number; employee_id: number; kind: string; title: string; done: number };
export type Leave = {
  id: number; employee_id: number; type: string; start_date: string; end_date: string;
  reason: string | null; status: "pending" | "approved" | "rejected";
};
