import { afterEach, describe, expect, it, vi } from "vitest";

import { useDebounce } from "./helpers";

describe("useDebounce", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it("cancels a scheduled trailing invocation", () => {
        vi.useFakeTimers();
        const callback = vi.fn();
        const { cancel, debounced } = useDebounce(callback, 100);

        debounced();
        cancel();
        vi.advanceTimersByTime(100);

        expect(callback).not.toHaveBeenCalled();
    });

    it("runs a trailing invocation when not cancelled", () => {
        vi.useFakeTimers();
        const callback = vi.fn();
        const { debounced } = useDebounce(callback, 100);

        debounced();
        vi.advanceTimersByTime(100);

        expect(callback).toHaveBeenCalledTimes(1);
    });
});
