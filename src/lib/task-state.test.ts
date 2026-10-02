import {taskReasonLabel} from "./task-state";

const words: Record<string, string> = {
  "tasks.reasons.no_node_offers_runtime":
    "No node offers the runtime it asked for.",
  "tasks.reasons.runtime_not_offered":
    "The node it was given to does not offer its runtime.",
};

const t = (key: string) => words[key] ?? key;

describe("taskReasonLabel", () => {
  it("says in words why a task failed when the workload gave a code", () => {
    expect(taskReasonLabel(t, "no_node_offers_runtime")).toBe(
      "No node offers the runtime it asked for.",
    );
  });

  it("keeps the attempt a task that is tried again was on", () => {
    expect(taskReasonLabel(t, "attempt 2 of 4: runtime_not_offered")).toBe(
      "attempt 2 of 4: The node it was given to does not offer its runtime.",
    );
  });

  it("leaves what the workload said in words of its own as it said it", () => {
    const said =
      "attempt 1: Error response from daemon: pull access denied for nope";

    expect(taskReasonLabel(t, said)).toBe(said);
  });

  it("leaves a code nobody has words for as it is", () => {
    expect(taskReasonLabel(t, "image_not_found")).toBe("image_not_found");
  });
});
