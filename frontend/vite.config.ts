import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    build: {
        outDir: "../backend/app/static",
        emptyOutDir: true,
        assetsDir: "assets",
    },
    base: "./", // Use relative base path for production builds
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    test: {
        environment: "jsdom",
        include: ["src/**/*.test.{ts,tsx}"],
        setupFiles: ["./src/test/setup.ts"],
        // A shared worker avoids the Windows worker-teardown hang observed with
        // Vitest 4 while the explicit mock resets and RTL cleanup preserve
        // deterministic test-state cleanup between files.
        pool: "threads",
        isolate: false,
        fileParallelism: false,
        maxWorkers: 1,
        clearMocks: true,
        mockReset: true,
        restoreMocks: true,
    },
});
