// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FollowUpSnoozeButtons } from "./follow-up-snooze-buttons";
import * as api from "@/lib/api";

describe("FollowUpSnoozeButtons", () => {
  it("rendert Schnellbuttons (+3 Tage, +1 Woche, +2 Wochen) und führt Snooze-Call aus", async () => {
    const postSpy = vi.spyOn(api, "apiPost").mockResolvedValue({
      success: true,
      nextStepDate: new Date("2026-09-04").toISOString(),
      message: "Wiedervorlage verschoben.",
    });

    const onSnoozedMock = vi.fn();

    render(
      <FollowUpSnoozeButtons
        applicationId="app-1"
        onSnoozed={onSnoozedMock}
      />
    );

    const weekBtn = screen.getByText("+1 Woche");
    expect(weekBtn).toBeDefined();

    fireEvent.click(weekBtn);

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith("/api/applications/app-1/snooze", { days: 7 });
      expect(onSnoozedMock).toHaveBeenCalled();
    });
  });
});
