import {formatBytes, fromBytes, GiB, MiB, toBytes} from "./units";

describe("sizes", () => {
  it("are sent as bytes, whatever unit they were typed in", () => {
    expect(toBytes({amount: 512, unit: "MiB"})).toBe(512 * 1024 * 1024);
    expect(toBytes({amount: 2, unit: "GiB"})).toBe(2 * 1024 * 1024 * 1024);
  });

  it("keep a fraction of a GiB, to the whole MiB", () => {
    expect(toBytes({amount: 1.5, unit: "GiB"})).toBe(1536 * MiB);
    expect(toBytes({amount: 0.33, unit: "GiB"})).toBe(338 * MiB);
  });

  it("are no size at all when nothing positive was typed", () => {
    expect(toBytes({amount: 0, unit: "GiB"})).toBe(0);
    expect(toBytes({amount: -1, unit: "MiB"})).toBe(0);
    expect(toBytes({amount: Number.NaN, unit: "MiB"})).toBe(0);
  });

  it("are shown in whole GiB when they are, and in MiB otherwise", () => {
    expect(fromBytes(20 * GiB)).toEqual({amount: 20, unit: "GiB"});
    expect(fromBytes(1536 * MiB)).toEqual({amount: 1536, unit: "MiB"});
    expect(fromBytes(0)).toEqual({amount: 0, unit: "MiB"});
  });

  it("read back to the very bytes they were shown from", () => {
    for (const bytes of [128 * MiB, 1536 * MiB, 8 * GiB, 50 * GiB]) {
      expect(toBytes(fromBytes(bytes))).toBe(bytes);
    }
  });

  it("are read in the unit that suits them", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(512 * MiB)).toBe("512 MiB");
    expect(formatBytes(1536 * MiB)).toBe("1.5 GiB");
    expect(formatBytes(20 * GiB)).toBe("20 GiB");
    expect(formatBytes(1023 * MiB)).toBe("1,023 MiB");
  });
});
