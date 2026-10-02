import {validationMessage} from "./validation-errors";

const words: Record<string, string> = {
  "errors.validation.mixed_runtimes_in_stack":
    "every service in a stack has to run with the same runtime",
};

const t = (key: string) => words[key] ?? key;

describe("validationMessage", () => {
  it("puts a code that arrives as itself into words", () => {
    expect(validationMessage(t, "mixed_runtimes_in_stack")).toBe(
      "every service in a stack has to run with the same runtime",
    );
  });

  it("shows a message the backend already put into words as it came", () => {
    expect(validationMessage(t, "the provided value is invalid")).toBe(
      "the provided value is invalid",
    );
  });

  it("shows a code nobody has words for as it is", () => {
    expect(validationMessage(t, "brand_new_code")).toBe("brand_new_code");
  });

  it("does not take a message for a path into the dictionary", () => {
    expect(validationMessage(t, "errors.validation")).toBe("errors.validation");
  });
});
