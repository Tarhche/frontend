const FILE_NAMES: Record<string, string> = {
  go: "main.go",
  python: "main.py",
  py: "main.py",
  javascript: "index.js",
  js: "index.js",
  jsx: "App.js",
  typescript: "index.ts",
  ts: "index.ts",
  tsx: "App.tsx",
  java: "Main.java",
  c: "main.c",
  cpp: "main.cpp",
  "c++": "main.cpp",
  csharp: "Program.cs",
  rust: "main.rs",
  rs: "main.rs",
  php: "index.php",
  ruby: "main.rb",
  rb: "main.rb",
  bash: "script.sh",
  sh: "script.sh",
  shell: "script.sh",
  html: "index.html",
  css: "styles.css",
  json: "data.json",
  yaml: "config.yaml",
  yml: "config.yml",
  sql: "query.sql",
};

/**
 * What to call a snippet in the bar above it. A sandbox names the file it is
 * showing; an article has a language and nothing else, so the language is
 * turned into the file it would be written in.
 */
export function fileNameFor(language?: string): string {
  const name = (language ?? "").trim().toLowerCase();

  if (!name) {
    return "snippet.txt";
  }

  return FILE_NAMES[name] ?? `snippet.${name}`;
}
