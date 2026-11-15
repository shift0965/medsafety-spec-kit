// Role tabs with unread alert counts (research R5, R6). No sign-in in the prototype.
import type { PersonId } from "../domain/types";
import { unreadCount } from "../domain/alerts";
import { useStore } from "../state/store";

const roles: { id: PersonId; label: string }[] = [
  { id: "harold", label: "Harold" },
  { id: "rachel", label: "Rachel" },
  { id: "nguyen", label: "Dr. Nguyen" },
];

export default function RoleSwitcher({ role, onChange }: { role: PersonId; onChange: (r: PersonId) => void }) {
  const { state } = useStore();
  return (
    <nav className="roles" aria-label="Choose whose view to show">
      {roles.map((r) => {
        const unread = unreadCount(state, r.id);
        return (
          <button
            key={r.id}
            className={`roles__tab${role === r.id ? " roles__tab--active" : ""}`}
            aria-pressed={role === r.id}
            onClick={() => onChange(r.id)}
          >
            {r.label}
            {unread > 0 && (
              <span className="roles__badge" aria-label={`${unread} unread`}>
                {unread}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
