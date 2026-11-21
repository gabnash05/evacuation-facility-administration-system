import { afterEach, describe, expect, it, vi } from "vitest";

const render = vi.fn();
const createRoot = vi.fn(() => ({ render }));

async function loadMain() {
    vi.resetModules();
    vi.doMock("react-dom/client", () => ({ createRoot }));
    vi.doMock("./App.tsx", () => ({ default: () => null }));
    vi.doMock("./components/common/ThemeProvider.tsx", () => ({
        ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
    }));

    await import("./main");
}

afterEach(() => {
    document.body.innerHTML = "";
    render.mockClear();
    createRoot.mockClear();
    vi.doUnmock("react-dom/client");
    vi.doUnmock("./App.tsx");
    vi.doUnmock("./components/common/ThemeProvider.tsx");
    vi.resetModules();
});

describe("main", () => {
    it("mounts the application through the root element", async () => {
        const root = document.createElement("div");
        root.id = "root";
        document.body.append(root);

        await loadMain();

        expect(createRoot).toHaveBeenCalledWith(root);
        expect(render).toHaveBeenCalledOnce();
    });
});
