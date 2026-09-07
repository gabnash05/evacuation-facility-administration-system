// @vitest-environment node

import { describe, expect, it } from "vitest";

import config from "../../vite.config";

describe("Vite and Vitest configuration", () => {
    it("uses the documented production asset target and deterministic test runner", () => {
        expect(config.build).toMatchObject({
            outDir: "../backend/app/static",
            assetsDir: "assets",
        });
        expect(config.test).toMatchObject({
            environment: "jsdom",
            pool: "threads",
            isolate: false,
            fileParallelism: false,
            maxWorkers: 1,
            clearMocks: true,
            mockReset: true,
            restoreMocks: true,
        });
    });
});
