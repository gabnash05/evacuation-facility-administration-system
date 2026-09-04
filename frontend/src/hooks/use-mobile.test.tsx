import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useIsMobile } from "./use-mobile";

let changeListener: (() => void) | undefined;
const addEventListener = vi.fn((event: string, listener: () => void) => {
    if (event === "change") changeListener = listener;
});
const removeEventListener = vi.fn();

function setWindowWidth(width: number) {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
}

describe("useIsMobile", () => {
    beforeEach(() => {
        changeListener = undefined;
        addEventListener.mockClear();
        removeEventListener.mockClear();
        vi.stubGlobal(
            "matchMedia",
            vi.fn(() => ({ addEventListener, removeEventListener }))
        );
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("tracks the documented 768px responsive breakpoint and cleans up its listener", () => {
        setWindowWidth(767);
        const { result, unmount } = renderHook(() => useIsMobile());

        expect(result.current).toBe(true);
        expect(addEventListener).toHaveBeenCalledWith("change", expect.any(Function));

        setWindowWidth(768);
        act(() => changeListener?.());
        expect(result.current).toBe(false);

        unmount();
        expect(removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
    });
});
