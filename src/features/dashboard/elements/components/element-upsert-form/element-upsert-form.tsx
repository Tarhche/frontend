"use client";
import React, { useMemo, useState } from "react";
import { useActionState } from "react";
import dynamic from "next/dynamic";
import {
  Group,
  Stack,
  Button,
  Box,
  Text,
} from "@mantine/core";
import { upsertElementAction } from "../../actions/upsert-element";
import ServerComponentErrorHandler from "@/components/errors/server-component-error-handler";
import {FormDataCodec} from "@/lib/form-data-codec";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

type Props = {
  element?: any;
};

export function ElementUpsertForm({ element }: Props) {
  const [state, dispatch, isPending] = useActionState(upsertElementAction, {
    success: true,
    status: null,
  });

  // Derive an initial JSON string from possible element fields
  const initialJson = useMemo(() => {
    const candidate = element;

    if (typeof candidate === "string") {
      try {
        return JSON.stringify(JSON.parse(candidate), null, 2);
      } catch {
        return candidate; // already a string, keep as-is
      }
    }
    if (candidate && typeof candidate === "object") {
      try {
        return JSON.stringify(candidate, null, 2);
      } catch {
        return "{}";
      }
    }
    return "{}";
  }, [element]);

  const [jsonValue, setJsonValue] = useState<string>(initialJson);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const validateJson = (value: string) => {
    try {
      JSON.parse(value);
      setJsonError(null);
      return true;
    } catch {
      setJsonError("JSON نامعتبر است");
      return false;
    }
  };

  const handleEditorChange = (value?: string) => {
    const v = value ?? "";
    setJsonValue(v);
    // validate on each change (optional: debounce if editor feels sluggish)
    if (v.trim().length > 0) validateJson(v);
    else setJsonError("JSON خالی است");
  };

  const prettify = () => {
    try {
      const pretty = JSON.stringify(JSON.parse(jsonValue), null, 2);
      setJsonValue(pretty);
      setJsonError(null);
    } catch {
      setJsonError("برای قالب‌بندی، ابتدا JSON معتبر وارد کنید");
    }
  };

  const handleSubmit = async () => {
    if (!validateJson(jsonValue)) {
      alert('Invalid json')
      return;
    }

    dispatch(FormDataCodec.fromObject({...(JSON.parse(jsonValue)), is_update: !!element}));
  };

  return (
    <form action={handleSubmit}>
      <ServerComponentErrorHandler state={state} />
      <Stack gap="lg">
        <div>
          <Text size="sm" fw={600} mb="xs">
            ویرایش JSON
          </Text>
          <Box
            dir={'ltr'}
            style={{
              border: "1px solid var(--mantine-color-gray-4)",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <MonacoEditor
              height="420px"
              language="json"
              value={jsonValue}
              onChange={handleEditorChange}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                readOnly: isPending,
                wordWrap: "on",
                automaticLayout: true,
                tabSize: 2,
              }}
            />
          </Box>
          {(jsonError || state.fieldErrors) && (
            <Text c="red" size="sm" mt="xs">
              {jsonError || JSON.stringify(state.fieldErrors)}
            </Text>
          )}
        </div>

        <Group justify="space-between" mt="xs">
          <Button
            variant="default"
            onClick={prettify}
            disabled={isPending}
            type="button"
          >
            قالب‌بندی JSON
          </Button>

          <Group justify="flex-end">
            <Button
              type="submit"
              loading={isPending}
              disabled={isPending || !!jsonError}
            >
              {element ? "بروزرسانی المان" : "ایجاد المان"}
            </Button>
          </Group>
        </Group>
      </Stack>
    </form>
  );
}
