import {AxiosError, AxiosHeaders, type InternalAxiosRequestConfig} from "axios";
import {DALDriverError} from "@/dal/dal-driver-error";
import {
  fieldPaths,
  hasMoreToSay,
  problemMessage,
  problemOf,
  unshownRefusals,
} from "./problem";

const config = {headers: new AxiosHeaders()} as InternalAxiosRequestConfig;

/** A request the server answered with this status and body. */
function answered(status: number, data: unknown) {
  return new AxiosError(
    "request failed",
    undefined,
    config,
    {},
    {
      status,
      statusText: "",
      data,
      headers: {},
      config,
    },
  );
}

// the words are the dictionary's business; which ones are asked for is this.
const t = (key: string) => key;

describe("problemOf", () => {
  it("keeps what was refused, by field", () => {
    const problem = problemOf(
      answered(400, {errors: {image: "image is required", vm_uuid: ["no"]}}),
    );

    expect(problem.fields).toEqual({image: "image is required", vm_uuid: "no"});
    expect(problem.unanswered).toBe(false);
  });

  it("keeps the workload's code and what the node said", () => {
    const problem = problemOf(
      answered(404, {code: "not_found", message: "no such container: web"}),
    );

    expect(problem.code).toBe("not_found");
    expect(problem.detail).toBe("no such container: web");
  });

  it("reads the code whether or not it came wrapped", () => {
    expect(problemOf(answered(500, {error: {code: "internal"}})).code).toBe(
      "internal",
    );
  });

  it("keeps the output a failed compose command left", () => {
    expect(
      problemOf(answered(400, {errors: {compose: "bad"}, output: "line 3"}))
        .output,
    ).toBe("line 3");
  });

  it("knows a request nobody answered may still be under way", () => {
    expect(problemOf(answered(504, {code: "timeout"})).unanswered).toBe(true);
    expect(problemOf(answered(502, "")).unanswered).toBe(true);
    expect(
      problemOf(new AxiosError("Network Error", "ERR_NETWORK", config))
        .unanswered,
    ).toBe(true);
  });

  it("reads what a server action was answered with the same way", () => {
    const problem = problemOf(
      new DALDriverError("refused", 400, {
        data: {errors: {vm: "That is more than your quota allows."}},
      }),
    );

    expect(problem).toEqual({
      status: 400,
      fields: {vm: "That is more than your quota allows."},
      unanswered: false,
    });
  });

  it("has nothing to read in what nobody answered at all", () => {
    expect(problemOf(new Error("boom"))).toEqual({
      fields: {},
      unanswered: false,
    });
  });
});

describe("problemMessage", () => {
  it("says the platform's codes in the reader's words, with the node's after", () => {
    expect(
      problemMessage(
        problemOf(answered(404, {code: "not_found", message: "gone: web"})),
        t,
      ),
    ).toBe("workload.errors.not_found gone: web");
  });

  it("says what was refused when that is all there is", () => {
    expect(
      problemMessage(problemOf(answered(400, {errors: {name: "taken"}})), t),
    ).toBe("taken");
  });

  it("says what was refused about the request as a whole first", () => {
    const problem = problemOf(
      answered(400, {
        errors: {name: "taken", docker: "Docker refused: port in use"},
      }),
    );

    expect(problemMessage(problem, t)).toBe(
      "Docker refused: port in use taken",
    );
  });

  it("leaves out what a form already says beside a field", () => {
    const problem = problemOf(
      answered(400, {errors: {name: "taken", vm: "The VM is not running."}}),
    );
    const shown = (path: string) => path === "name" || path === "vm";

    expect(problemMessage(problem, t, shown)).toBe("The VM is not running.");
    expect(unshownRefusals(problem, shown)).toEqual([
      ["vm", "The VM is not running."],
    ]);
    expect(hasMoreToSay(problem, shown)).toBe(true);
    expect(
      hasMoreToSay(problemOf(answered(400, {errors: {name: "taken"}})), shown),
    ).toBe(false);
  });

  it("falls back to what the status means", () => {
    expect(problemMessage(problemOf(answered(409, "")), t)).toBe(
      "errors.http.conflict",
    );
  });

  it("says a request that went unanswered may still be under way", () => {
    expect(problemMessage(problemOf(answered(504, "")), t)).toBe(
      "workload.errors.unanswered",
    );
  });
});

describe("fieldPaths", () => {
  it("reads every refusal as the JSON path of what it is about", () => {
    expect(
      fieldPaths(
        {
          "container.ports.0": "taken",
          "mounts[1].target": "relative",
          image: "required",
          "vm.network.ingress": "invalid",
        },
        "container",
      ),
    ).toEqual({
      "ports.0": "taken",
      "mounts.1.target": "relative",
      image: "required",
      "vm.network.ingress": "invalid",
    });
  });
});
