"use client";
import {forwardRef, useState, useEffect} from "react";
import {
  DatesProvider,
  DateTimePicker,
  DateTimePickerProps,
} from "@mantine/dates";
import "@mantine/dates/styles.css";

interface DateTimeInputProps extends Omit<DateTimePickerProps, "defaultValue"> {
  defaultValue?: any;
  name?: string;
}

export const DateTimeInput = forwardRef<HTMLButtonElement, DateTimeInputProps>(
  (props, ref) => {
    const {name, defaultValue, ...pickerProps} = props;

    const [selected, setSelected] = useState<any>(defaultValue ?? null);

    const [isoValue, setIsoValue] = useState<string>("");

    useEffect(() => {
      if (selected == null) {
        setIsoValue("");
        return;
      }

      let jsDate: Date;

      if (typeof selected.toDate === "function") {
        jsDate = selected.toDate();
      } else if (selected instanceof Date) {
        jsDate = selected;
      } else {
        jsDate = new Date(selected);
      }

      const fullIso = jsDate.toISOString(); // "2025-05-25T00:00:00.000Z"
      const noMsIso = fullIso.replace(/\.\d{3}Z$/, "Z"); // "2025-05-25T00:00:00Z"
      setIsoValue(noMsIso);
    }, [selected]);

    useEffect(() => {
      setSelected(defaultValue ?? null);
    }, [defaultValue]);

    const handleChange = (value: any) => {
      setSelected(value);
    };

    return (
      <DatesProvider settings={{locale: "fa"}}>
        <DateTimePicker
          {...pickerProps}
          value={selected}
          onChange={handleChange}
          ref={ref}
        />
        {name && <input type="hidden" name={name} value={isoValue} />}
      </DatesProvider>
    );
  },
);

DateTimeInput.displayName = "DateTimeInput";
