import { describe, it, expect, vi, beforeEach } from "vitest";

describe("speech.js voice selection (regression check)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("speaks without throwing and prefers Enhanced-tier voice over compact for same exact lang", async () => {
    const compact = { name: "Joana", lang: "pt-PT" };
    const enhanced = { name: "Joana (Enhanced)", lang: "pt-PT" };
    let onvoiceschanged = null;
    window.speechSynthesis = {
      getVoices: () => [compact, enhanced],
      speak: vi.fn(),
      cancel: vi.fn(),
      set onvoiceschanged(fn) {
        onvoiceschanged = fn;
      },
      get onvoiceschanged() {
        return onvoiceschanged;
      },
    };
    global.SpeechSynthesisUtterance = function (text) {
      this.text = text;
    };
    const mod = await import("./speech.js");
    expect(() => mod.speak("ola", "pt")).not.toThrow();
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
    const utt = window.speechSynthesis.speak.mock.calls[0][0];
    expect(utt.voice).toBe(enhanced);
  });
});
