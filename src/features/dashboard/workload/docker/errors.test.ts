import {AxiosError, AxiosHeaders, type InternalAxiosRequestConfig} from "axios";
import {problemMessage, problemOf, retryTransient} from "./errors";

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

  it("keeps the node's code and what dockerd said", () => {
    const problem = problemOf(
      answered(422, {
        error: {code: "invalid", message: "port is already allocated"},
      }),
    );

    expect(problem.code).toBe("invalid");
    expect(problem.detail).toBe("port is already allocated");
  });

  it("reads the code whether or not it came wrapped", () => {
    expect(problemOf(answered(409, {code: "not_running"})).code).toBe(
      "not_running",
    );
  });

  it("keeps the output a failed compose command left", () => {
    expect(
      problemOf(answered(400, {errors: {compose: "bad"}, output: "line 3"}))
        .output,
    ).toBe("line 3");
  });

  it("knows a request nobody answered may still be under way", () => {
    expect(problemOf(answered(504, "")).unanswered).toBe(true);
    expect(problemOf(answered(500, {code: "timeout"})).unanswered).toBe(true);
    expect(
      problemOf(new AxiosError("Network Error", "ERR_NETWORK", config))
        .unanswered,
    ).toBe(true);
  });
});

describe("problemMessage", () => {
  it("says the platform's codes in the reader's words, with docker's after", () => {
    expect(
      problemMessage(
        problemOf(
          answered(422, {error: {code: "invalid", message: "no such image"}}),
        ),
        t,
      ),
    ).toBe("docker.errors.invalid no such image");
  });

  it("says what was refused when that is all there is", () => {
    expect(
      problemMessage(problemOf(answered(400, {errors: {name: "taken"}})), t),
    ).toBe("taken");
  });

  it("falls back to what the status means", () => {
    expect(problemMessage(problemOf(answered(404, "")), t)).toBe(
      "errors.http.notFound",
    );
  });

  it("says a request that went unanswered may still be under way", () => {
    expect(problemMessage(problemOf(answered(504, "")), t)).toBe(
      "docker.errors.unanswered",
    );
  });
});

describe("retryTransient", () => {
  it("does not ask again what was refused", () => {
    expect(retryTransient(0, answered(404, ""))).toBe(false);
  });

  it("asks again, a couple of times, what may pass", () => {
    expect(retryTransient(0, answered(503, ""))).toBe(true);
    expect(retryTransient(2, answered(503, ""))).toBe(false);
  });
});
