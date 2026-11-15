import { useState } from "react";
import type { PersonId } from "./domain/types";
import { StoreProvider } from "./state/store";
import RoleSwitcher from "./components/RoleSwitcher";
import DemoBar from "./components/DemoBar";
import HaroldView from "./views/HaroldView";
import RachelView from "./views/RachelView";
import NguyenView from "./views/NguyenView";

export default function App() {
  const [role, setRole] = useState<PersonId>("harold");
  return (
    <StoreProvider>
      <header className="app-header">
        <span className="app-header__title">Medication Safety Prototype · V2</span>
        <RoleSwitcher role={role} onChange={setRole} />
      </header>
      <DemoBar />
      <main className="app-main">
        {role === "harold" && <HaroldView />}
        {role === "rachel" && <RachelView />}
        {role === "nguyen" && <NguyenView />}
      </main>
      <footer className="app-footer">Mock data only. No real patient information or notifications.</footer>
    </StoreProvider>
  );
}
