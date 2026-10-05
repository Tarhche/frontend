"use client";

import {useEffect, useRef} from "react";
import {
  currentScheme,
  mountCodeMirror,
  watchScheme,
  type MountedCode,
} from "@/features/code-highlight/codemirror";
import classes from "./compose-editor.module.css";

type Props = {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;

  /** the ids of what names and describes it, since it is not an input. */
  labelledBy?: string;
  describedBy?: string;
  invalid?: boolean;
  height?: number;
};

/**
 * A compose file, written in YAML with its highlighting, in the same editor
 * snippets are written in. It follows the page between light and dark.
 *
 * The editor is built once; what changes afterwards — the text from outside,
 * whether it may be written in — is set on it rather than by building another
 * one, which would lose where somebody was in it.
 */
export function ComposeEditor({
  value,
  onChange,
  readOnly = false,
  labelledBy,
  describedBy,
  invalid = false,
  height = 360,
}: Props) {
  const box = useRef<HTMLDivElement>(null);
  const editor = useRef<MountedCode | null>(null);

  // the latest of what the page wants told, read when somebody types.
  const changed = useRef(onChange);
  useEffect(() => {
    changed.current = onChange;
  });

  // the first of these the editor is built with; the effects below keep it
  // up to date with the rest.
  const initial = useRef({value, readOnly});

  useEffect(() => {
    if (!box.current) {
      return;
    }

    const mounted = mountCodeMirror(box.current, {
      code: initial.current.value,
      language: "yaml",
      editable: !initial.current.readOnly,
      scheme: currentScheme(),
      onChange: (code) => changed.current?.(code),
    });
    editor.current = mounted;

    const unwatch = watchScheme((scheme) => mounted.setScheme(scheme));

    return () => {
      unwatch();
      mounted.destroy();
      editor.current = null;
    };
  }, []);

  useEffect(() => {
    editor.current?.setCode(value);
  }, [value]);

  useEffect(() => {
    editor.current?.setEditable(!readOnly);
  }, [readOnly]);

  // what is typed in is the editor's own element, which is what a screen
  // reader lands on: it is named and described where it is.
  useEffect(() => {
    const content = editor.current?.view.contentDOM;
    if (!content) {
      return;
    }

    const set = (name: string, to: string | undefined) =>
      to ? content.setAttribute(name, to) : content.removeAttribute(name);

    set("aria-labelledby", labelledBy);
    set("aria-describedby", describedBy);
    set("aria-invalid", invalid ? "true" : undefined);
  }, [labelledBy, describedBy, invalid]);

  return (
    <div
      ref={box}
      dir="ltr"
      className={classes.editor}
      data-invalid={invalid}
      style={{["--compose-editor-height" as string]: `${height}px`}}
    />
  );
}
