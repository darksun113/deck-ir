import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parsePptx } from "../src/index";

describe("golden: 百纳维.pptx", () => {
  it("parses multiple slides with absolute-positioned sections and no editable-slot artifacts", async () => {
    const buf = new Uint8Array(
      readFileSync(fileURLToPath(new URL("../examples/百纳维.pptx", import.meta.url))),
    );
    const { slides, slideSize } = await parsePptx(buf);
    expect(slides.length).toBeGreaterThan(0);
    expect(slideSize.w).toBeGreaterThan(0);
    expect(slideSize.h).toBeGreaterThan(0);
    const html = slides.map((s) => s.html).join("");
    expect(html).toContain("<section");
    expect(html).toContain("position:absolute");
    expect(html).not.toContain("{{");            // core emits no editable-slot tokens
    expect(html).not.toContain("data-editable"); // no VLM attributes
  });
});
