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
    const result = component();
    const serialized = JSON.stringify(result);
    expect(serialized).toContain("Sanskrit Analyzer");
  });

  it("does not contain sample verse blockquote", () => {
    const pageSource = fs.readFileSync(
      path.resolve(__dirname, "../app/page.tsx"),
      "utf-8"
    );
    expect(pageSource).not.toContain("blockquote");
    expect(pageSource).not.toContain("Sample Verse");
  });
});
