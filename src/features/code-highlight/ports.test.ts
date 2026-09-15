import {parsePorts} from "@/features/articles/components/article-editor/plugins/runnable-code-block/utils";

describe("parsePorts", () => {
  it("reads the ports out of what an author wrote", () => {
    expect(parsePorts("8080, 3000")).toEqual([8080, 3000]);
    expect(parsePorts("8080 3000")).toEqual([8080, 3000]);
  });

  it("leaves out what is not a port rather than arguing about it", () => {
    expect(parsePorts("8080, http, -1, 0, 70000")).toEqual([8080]);
  });

  it("says the same port once", () => {
    expect(parsePorts("8080,8080")).toEqual([8080]);
  });

  it("nothing written down is no ports", () => {
    expect(parsePorts("")).toEqual([]);
    expect(parsePorts(null)).toEqual([]);
    expect(parsePorts(undefined)).toEqual([]);
  });
});
