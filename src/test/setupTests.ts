// -----------------------------------------------------------------------------
// Globales Vitest-Setup für Komponenten-Tests
// -----------------------------------------------------------------------------
// Wird laut vitest.config.mts vor JEDER Testdatei geladen — auch vor den
// bestehenden Lib-/API-Tests unter "node"-Umgebung. Das ist unproblematisch:
// `@testing-library/jest-dom/vitest` erweitert nur `expect` um zusätzliche
// Matcher (kein DOM-Zugriff beim Import), und `cleanup()` ist ein No-Op,
// solange nichts gerendert wurde.
//
// `@testing-library/react` räumt seit v14 zwar automatisch nach jedem Test
// auf, sofern es ein globales `afterEach` erkennt — dieses Projekt nutzt aber
// bewusst `test.globals: false` (siehe vitest.config.mts) und importiert
// `describe`/`it`/`expect` explizit aus "vitest". Die Auto-Erkennung greift
// dadurch nicht, daher wird `cleanup()` hier explizit registriert.
// -----------------------------------------------------------------------------
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});

// jsdom implementiert `<dialog>` selbst in aktuellen Versionen nur teilweise:
// `showModal()`/`close()` fehlen komplett (siehe https://github.com/jsdom/jsdom/issues/3294),
// obwohl das `open`-Attribut unterstützt wird. `src/components/ui/dialog.tsx`
// (Basis fast aller Modals der App) ruft genau diese Methoden imperativ auf,
// wodurch jeder Komponenten-Test mit einem offenen Dialog sonst mit
// "dialog.showModal is not a function" abstürzt. Der Guard greift nur unter
// jsdom (`typeof HTMLDialogElement`) und lässt die Lib-/API-Tests in der
// "node"-Umgebung unberührt.
if (typeof HTMLDialogElement !== "undefined") {
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    };
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    };
  }
}
