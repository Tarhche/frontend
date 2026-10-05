import {
  formatBytes,
  formatPortBinding,
  GiB,
  MiB,
  portNumber,
  shellWords,
  shortId,
} from "./format";

describe("shellWords", () => {
  it("splits a command on the spaces between its arguments", () => {
    expect(shellWords("nginx -g 'daemon off;'")).toEqual({
      words: ["nginx", "-g", "daemon off;"],
      unterminated: false,
    });
  });

  it("keeps what is quoted together, whichever quotes were used", () => {
    expect(shellWords(`sh -c "echo \\"hi\\" && sleep 1"`).words).toEqual([
      "sh",
      "-c",
      'echo "hi" && sleep 1',
    ]);
  });

  it("keeps an escaped space inside its argument", () => {
    expect(shellWords("ls /my\\ files").words).toEqual(["ls", "/my files"]);
  });

  it("keeps an empty argument somebody quoted on purpose", () => {
    expect(shellWords(`printf ''`).words).toEqual(["printf", ""]);
  });

  it("has nothing to say about a blank line", () => {
    expect(shellWords("   ").words).toEqual([]);
  });

  it("says when a quote was left open", () => {
    expect(shellWords(`echo "hi`).unterminated).toBe(true);
  });
});

describe("formatBytes", () => {
  it("says a size in the largest unit it has a whole one of", () => {
    expect(formatBytes(512 * MiB, "en")).toBe("512 MiB");
    expect(formatBytes(1.5 * GiB, "en")).toBe("1.5 GiB");
    expect(formatBytes(20 * GiB, "en")).toBe("20 GiB");
  });

  it("says nothing is nothing", () => {
    expect(formatBytes(0, "en")).toBe("0 B");
  });
});

describe("ports", () => {
  it("writes a binding host side first, the way docker does", () => {
    expect(
      formatPortBinding({container_port: 80, host_port: 8080, protocol: "tcp"}),
    ).toBe("8080→80/tcp");
  });

  it("takes only whole numbers a port can be", () => {
    expect(portNumber("8080")).toBe(8080);
    expect(portNumber("")).toBeNull();
    expect(portNumber("0")).toBeNull();
    expect(portNumber("65536")).toBeNull();
    expect(portNumber("80.5")).toBeNull();
  });
});

describe("shortId", () => {
  it("drops the digest's name and keeps twelve characters", () => {
    expect(
      shortId(
        "sha256:4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945",
      ),
    ).toBe("4f53cda18c2b");
  });
});
