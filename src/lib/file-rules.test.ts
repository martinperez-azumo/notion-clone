import { describe, expect, it } from "vitest";

import {
  isAllowedContentType,
  isInlineContentType,
  pageUploadPrefix,
  safeFileName,
} from "./file-rules";

describe("safeFileName", () => {
  it("keeps ordinary names", () => {
    expect(safeFileName("Q3 report.pdf")).toBe("Q3-report.pdf");
    expect(safeFileName("diagram_v2.png")).toBe("diagram_v2.png");
  });

  it("strips directories and traversal", () => {
    expect(safeFileName("../../etc/passwd")).toBe("passwd");
    expect(safeFileName("C:\\Users\\me\\notes.txt")).toBe("notes.txt");
    expect(safeFileName("..")).toBe("file");
  });

  it("never returns an empty or hidden name", () => {
    expect(safeFileName("")).toBe("file");
    expect(safeFileName("???")).toBe("file");
    expect(safeFileName(".env")).toBe("env");
  });

  it("caps the length", () => {
    expect(safeFileName(`${"a".repeat(300)}.txt`).length).toBeLessThanOrEqual(100);
  });
});

describe("content types", () => {
  it("allows documents and media but not HTML or SVG", () => {
    expect(isAllowedContentType("application/pdf")).toBe(true);
    expect(isAllowedContentType("IMAGE/PNG")).toBe(true);
    expect(isAllowedContentType("text/plain; charset=utf-8")).toBe(true);
    expect(isAllowedContentType("text/html")).toBe(false);
    expect(isAllowedContentType("image/svg+xml")).toBe(false);
    expect(isAllowedContentType("")).toBe(false);
  });

  it("only shows media and PDFs inline", () => {
    expect(isInlineContentType("image/jpeg")).toBe(true);
    expect(isInlineContentType("application/pdf")).toBe(true);
    expect(isInlineContentType("text/plain")).toBe(false);
    expect(isInlineContentType("application/zip")).toBe(false);
  });
});

describe("pageUploadPrefix", () => {
  it("scopes uploads to the page", () => {
    expect(pageUploadPrefix("abc")).toBe("pages/abc/");
  });
});
