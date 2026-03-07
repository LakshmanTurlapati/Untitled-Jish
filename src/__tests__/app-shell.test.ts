import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("App shell page", () => {
  it("exports a default function component", async () => {
    const pageModule = await import("@/app/page");
    expect(typeof pageModule.default).toBe("function");
  });

  it("does not import or reference auth/login/session modules", () => {
    const pageSource = fs.readFileSync(
      path.resolve(__dirname, "../app/page.tsx"),
      "utf-8"
    );
    expect(pageSource).not.toMatch(/import.*auth/i);
    expect(pageSource).not.toMatch(/import.*login/i);
    expect(pageSource).not.toMatch(/import.*session/i);
    expect(pageSource).not.toMatch(/useSession/i);
    expect(pageSource).not.toMatch(/signIn/i);
  });

  it("contains the app title", async () => {
    const pageModule = await import("@/app/page");
    const component = pageModule.default;
    // The component should be callable and return JSX with Sanskrit Analyzer
    const result = component();
    // Serialize to check for title text
    const serialized = JSON.stringify(result);
    expect(serialized).toContain("Sanskrit Analyzer");
  });

  it("contains sample Devanagari text", async () => {
    const pageModule = await import("@/app/page");
    const result = pageModule.default();
    const serialized = JSON.stringify(result);
    // Should contain some Devanagari characters (Unicode range U+0900-U+097F)
    expect(serialized).toMatch(/[\u0900-\u097F]/);
  });
});
