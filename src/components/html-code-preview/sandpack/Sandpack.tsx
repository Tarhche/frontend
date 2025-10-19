import { Sandpack as CodesandboxSandPack } from "@codesandbox/sandpack-react";
import { Box } from '@mantine/core';

interface SandpackProps {
  template: string;
  files: Record<string, string>;
}

export default function Sandpack({ template, files } : SandpackProps) {
  return (
    <Box dir="ltr" w="100%">
      <CodesandboxSandPack template={template as any} files={files} />
    </Box>
  );
}
