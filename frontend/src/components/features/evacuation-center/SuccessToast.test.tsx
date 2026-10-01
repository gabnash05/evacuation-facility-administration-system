import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/common/ThemeProvider", () => ({ useTheme: () => ({ theme: "light" }) }));
import { SuccessToast } from "./SuccessToast";

describe("center SuccessToast", () => {
    afterEach(() => vi.useRealTimers());

    it("renders only when open and closes after its configured duration", () => {
        vi.useFakeTimers();
        const onClose = vi.fn();
        const { rerender } = render(
            <SuccessToast isOpen={false} message="Saved" onClose={onClose} />
        );
        expect(screen.queryByText("Saved")).not.toBeInTheDocument();

        rerender(<SuccessToast isOpen message="Saved" duration={25} onClose={onClose} />);
        expect(screen.getByText("Saved")).toBeInTheDocument();
        vi.advanceTimersByTime(25);
        expect(onClose).toHaveBeenCalledOnce();
    });
});
