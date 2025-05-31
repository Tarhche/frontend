import React from "react";
import {CodeHighlight as MantineCodeHighlight,  } from "@mantine/code-highlight";

function CodeHighlight({code, language}) {
  return (
    <MantineCodeHighlight
      mt="sm"
      mb="xl"
      code={code}
      language={language}
      copyLabel="کپی کردن"
      copiedLabel="کپی شد!"
      styles={{
        code: {
          fontSize: 14,
        },
      }}
    />
  );
}

export default CodeHighlight;
