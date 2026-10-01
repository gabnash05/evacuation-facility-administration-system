import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { useTheme } = vi.hoisted(() => ({ useTheme: vi.fn(() => ({ theme: "light" })) }));

vi.mock("@/components/common/ThemeProvider", () => ({ useTheme }));

import { SuccessToast } from "./SuccessToast";

describe("SuccessToast", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it("does not render or schedule dismissal while closed", () => {
        const onClose = vi.fn();
        vi.useFakeTimers();

        render(<SuccessToast isOpen={false} message="Saved" onClose={onClose} />);
        vi.advanceTimersByTime(5000);

        expect(screen.queryByText("Saved")).not.toBeInTheDocument();
        expect(onClose).not.toHaveBeenCalled();
    });

    it("exposes a successful result as a polite status and closes at its requested duration", () => {
        const onClose = vi.fn();
        vi.useFakeTimers();

        render(<SuccessToast isOpen message="Saved" duration={500} onClose={onClose} />);

        expect(screen.getByRole("status")).toHaveTextContent("Saved");
        vi.advanceTimersByTime(500);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("gives error messages alert semantics and enough time to read them", () => {
        const onClose = vi.fn();
        vi.useFakeTimers();

        render(<SuccessToast isOpen message="Unable to save" duration={500} onClose={onClose} />);

        expect(screen.getByRole("alert")).toHaveTextContent("Unable to save");
        vi.advanceTimersByTime(3999);
        expect(onClose).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1);
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
