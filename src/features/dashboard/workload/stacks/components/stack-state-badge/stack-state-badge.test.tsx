import en from "@/i18n/dictionaries/en.json";
import fa from "@/i18n/dictionaries/fa.json";
import {STACK_STATES} from "../../types";
import {stackStateColor} from "./stack-state-badge";

describe("a stack's state", () => {
  it("is named in every language, waiting and degraded among them", () => {
    for (const words of [en, fa]) {
      const states: Record<string, string> = words.stacks.states;

      for (const state of STACK_STATES) {
        expect(states[state]).toEqual(expect.any(String));
      }
    }
  });

  it("tells waiting and degraded apart from where a stack was asked to be", () => {
    expect(stackStateColor("degraded")).not.toBe(stackStateColor("running"));
    expect(stackStateColor("waiting")).not.toBe(stackStateColor("running"));
    expect(stackStateColor("waiting")).not.toBe(stackStateColor("stopped"));
    expect(stackStateColor("failed")).toBe("red");
  });

  it("shows a state nobody has named yet in grey", () => {
    expect(stackStateColor("exploded")).toBe("gray");
  });
});
