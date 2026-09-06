"use client";

import {EditorView, keymap, lineNumbers, drawSelection} from "@codemirror/view";
import {EditorState, Compartment} from "@codemirror/state";
import {LanguageDescription, indentOnInput} from "@codemirror/language";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import {languages} from "@codemirror/language-data";
import {monokai} from "@uiw/codemirror-theme-monokai";
import {eclipseInit} from "@uiw/codemirror-theme-eclipse";

export type Scheme = "light" | "dark";

const eclipse = eclipseInit({settings: {caret: "#000000"}});

const themeOf = (scheme: Scheme) => (scheme === "dark" ? monokai : eclipse);

/** A mounted code editor, and the handful of things anybody changes about it. */
export type MountedCode = {
  view: EditorView;
  /** Replaces what is written, without telling `onChange` about it. */
  setCode(code: string): void;
  setLanguage(language?: string): void;
  setScheme(scheme: Scheme): void;
  setEditable(editable: boolean): void;
  focus(): void;
  destroy(): void;
};

type Options = {
  code: string;
  language?: string;
  editable: boolean;
  scheme: Scheme;

  /** Called with what is written, whenever a person changes it. */
  onChange?: (code: string) => void;
};

/**
 * The editor a snippet is shown in, wherever it is shown.
 *
 * A reader gets one on the page and an author gets one in the article editor;
 * they are the same editor with the same theme, gutter and highlighting, so
 * writing a snippet looks like reading one.
 */
export function mountCodeMirror(
  parent: HTMLElement,
  {code, language, editable, scheme, onChange}: Options,
): MountedCode {
  const languages_ = new Compartment();
  const theme = new Compartment();
  const writable = new Compartment();

  // set while the code is being replaced from outside, so that what somebody
  // else wrote is not reported back as something this person typed.
  let replacing = false;

  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc: code,
      extensions: [
        lineNumbers(),
        history(),
        drawSelection(),
        indentOnInput(),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        languages_.of([]),
        theme.of(themeOf(scheme)),
        writable.of([
          EditorState.readOnly.of(!editable),
          EditorView.editable.of(editable),
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !replacing) {
            onChange?.(update.state.doc.toString());
          }
        }),
      ],
    }),
  });

  const setLanguage = (name?: string) => {
    const description = LanguageDescription.matchLanguageName(
      languages,
      name ?? "",
      true,
    );

    if (!description) {
      view.dispatch({effects: languages_.reconfigure([])});

      return;
    }

    void description.load().then((support) => {
      if (view.dom.isConnected) {
        view.dispatch({effects: languages_.reconfigure(support)});
      }
    });
  };

  setLanguage(language);

  return {
    view,

    setCode(next: string) {
      if (next === view.state.doc.toString()) {
        return;
      }

      replacing = true;
      view.dispatch({
        changes: {from: 0, to: view.state.doc.length, insert: next},
      });
      replacing = false;
    },

    setLanguage,

    setScheme(next: Scheme) {
      view.dispatch({effects: theme.reconfigure(themeOf(next))});
    },

    setEditable(next: boolean) {
      view.dispatch({
        effects: writable.reconfigure([
          EditorState.readOnly.of(!next),
          EditorView.editable.of(next),
        ]),
      });
    },

    focus() {
      view.focus();
    },

    destroy() {
      view.destroy();
    },
  };
}

/** What the page and the editor both read the colour scheme from. */
export function currentScheme(): Scheme {
  return (document.documentElement.getAttribute("data-mantine-color-scheme") ??
    "light") as Scheme;
}

/** Calls back whenever the reader switches between light and dark. */
export function watchScheme(onChange: (scheme: Scheme) => void): () => void {
  const observer = new MutationObserver(() => onChange(currentScheme()));

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-mantine-color-scheme"],
  });

  return () => observer.disconnect();
}
