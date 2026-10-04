"use client";

import {type ReactNode} from "react";
import {
  ActionIcon,
  Autocomplete,
  Button,
  Checkbox,
  Group,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import {IconPlus, IconTrash} from "@tabler/icons-react";
import {useTranslations} from "@/i18n/provider";
import {
  rowId,
  type EnvRow,
  type MountRow,
  type PortRow,
} from "./container-request";

type RowsProps<Row> = {
  rows: Row[];
  onChange: (rows: Row[]) => void;

  /** what is wrong with a row's field, said under it. */
  errorFor: (index: number, field?: string) => string | undefined;
  disabled?: boolean;
};

type ListProps = {
  empty: string;
  addLabel: string;
  onAdd: () => void;
  disabled?: boolean;
  children: ReactNode;
  count: number;
};

/** Rows of something, each removable, and a way to add another. */
function RowList({
  empty,
  addLabel,
  onAdd,
  disabled,
  children,
  count,
}: ListProps) {
  return (
    <Stack gap="xs">
      {count === 0 && (
        <Text size="sm" c="dimmed">
          {empty}
        </Text>
      )}
      {children}
      <Group>
        <Button
          variant="light"
          size="xs"
          leftSection={<IconPlus size={14} />}
          onClick={onAdd}
          disabled={disabled}
        >
          {addLabel}
        </Button>
      </Group>
    </Stack>
  );
}

function RemoveRow({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <ActionIcon
      variant="subtle"
      color="red"
      size="lg"
      mt={1}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
    >
      <IconTrash size={16} />
    </ActionIcon>
  );
}

function useRows<Row extends {id: string}>(
  rows: Row[],
  onChange: (rows: Row[]) => void,
) {
  return {
    update: (id: string, patch: Partial<Row>) =>
      onChange(rows.map((row) => (row.id === id ? {...row, ...patch} : row))),
    remove: (id: string) => onChange(rows.filter((row) => row.id !== id)),
  };
}

/** The container's environment, a KEY and its value per row. */
export function EnvRowsField({
  rows,
  onChange,
  errorFor,
  disabled,
}: RowsProps<EnvRow>) {
  const t = useTranslations();
  const {update, remove} = useRows(rows, onChange);

  return (
    <RowList
      count={rows.length}
      empty={t("containers.form.env.none")}
      addLabel={t("containers.form.env.add")}
      onAdd={() => onChange([...rows, {id: rowId(), key: "", value: ""}])}
      disabled={disabled}
    >
      {rows.map((row, index) => (
        <Group key={row.id} align="flex-start" wrap="nowrap" gap="xs">
          <TextInput
            aria-label={t("containers.form.env.key", {n: index + 1})}
            placeholder="KEY"
            value={row.key}
            onChange={(event) =>
              update(row.id, {key: event.currentTarget.value})
            }
            error={errorFor(index)}
            dir="ltr"
            autoComplete="off"
            style={{flex: 1}}
          />
          <TextInput
            aria-label={t("containers.form.env.value", {n: index + 1})}
            placeholder="value"
            value={row.value}
            onChange={(event) =>
              update(row.id, {value: event.currentTarget.value})
            }
            dir="ltr"
            autoComplete="off"
            style={{flex: 2}}
          />
          <RemoveRow
            label={t("containers.form.removeRow", {n: index + 1})}
            onClick={() => remove(row.id)}
            disabled={disabled}
          />
        </Group>
      ))}
    </RowList>
  );
}

/** The ports the container publishes on its VM, one binding per row. */
export function PortRowsField({
  rows,
  onChange,
  errorFor,
  disabled,
}: RowsProps<PortRow>) {
  const t = useTranslations();
  const {update, remove} = useRows(rows, onChange);

  return (
    <RowList
      count={rows.length}
      empty={t("containers.form.ports.none")}
      addLabel={t("containers.form.ports.add")}
      onAdd={() =>
        onChange([
          ...rows,
          {id: rowId(), containerPort: "", hostPort: "", protocol: "tcp"},
        ])
      }
      disabled={disabled}
    >
      {rows.map((row, index) => (
        <Group key={row.id} align="flex-start" wrap="nowrap" gap="xs">
          <TextInput
            aria-label={t("containers.form.ports.container", {n: index + 1})}
            placeholder={t("containers.form.ports.containerPlaceholder")}
            value={row.containerPort}
            onChange={(event) =>
              update(row.id, {containerPort: event.currentTarget.value})
            }
            error={errorFor(index, "container_port")}
            inputMode="numeric"
            dir="ltr"
            autoComplete="off"
            style={{flex: 1}}
          />
          <TextInput
            aria-label={t("containers.form.ports.host", {n: index + 1})}
            placeholder={
              row.containerPort.trim() ||
              t("containers.form.ports.hostPlaceholder")
            }
            value={row.hostPort}
            onChange={(event) =>
              update(row.id, {hostPort: event.currentTarget.value})
            }
            error={errorFor(index, "host_port")}
            inputMode="numeric"
            dir="ltr"
            autoComplete="off"
            style={{flex: 1}}
          />
          <SegmentedControl
            aria-label={t("containers.form.ports.protocol", {n: index + 1})}
            value={row.protocol}
            onChange={(protocol) =>
              update(row.id, {protocol: protocol === "udp" ? "udp" : "tcp"})
            }
            data={[
              {value: "tcp", label: "TCP"},
              {value: "udp", label: "UDP"},
            ]}
            disabled={disabled}
          />
          <RemoveRow
            label={t("containers.form.removeRow", {n: index + 1})}
            onClick={() => remove(row.id)}
            disabled={disabled}
          />
        </Group>
      ))}
    </RowList>
  );
}

type MountProps = RowsProps<MountRow> & {
  /** the VM's volumes, offered for a volume's name. */
  volumes: string[];
};

/** Where the container keeps what outlives it: volumes, and paths of its VM. */
export function MountRowsField({
  rows,
  onChange,
  errorFor,
  disabled,
  volumes,
}: MountProps) {
  const t = useTranslations();
  const {update, remove} = useRows(rows, onChange);

  return (
    <RowList
      count={rows.length}
      empty={t("containers.form.mounts.none")}
      addLabel={t("containers.form.mounts.add")}
      onAdd={() =>
        onChange([
          ...rows,
          {
            id: rowId(),
            type: "volume",
            source: "",
            target: "",
            readOnly: false,
          },
        ])
      }
      disabled={disabled}
    >
      {rows.map((row, index) => (
        <Stack key={row.id} gap={6}>
          <Group align="flex-start" wrap="nowrap" gap="xs">
            <SegmentedControl
              aria-label={t("containers.form.mounts.type", {n: index + 1})}
              value={row.type}
              onChange={(type) =>
                update(row.id, {type: type === "bind" ? "bind" : "volume"})
              }
              data={[
                {value: "volume", label: t("containers.form.mounts.volume")},
                {value: "bind", label: t("containers.form.mounts.bind")},
              ]}
              disabled={disabled}
            />
            {row.type === "volume" ? (
              <Autocomplete
                aria-label={t("containers.form.mounts.source", {n: index + 1})}
                placeholder={t("containers.form.mounts.volumePlaceholder")}
                data={volumes}
                value={row.source}
                onChange={(source) => update(row.id, {source})}
                error={errorFor(index, "source")}
                dir="ltr"
                style={{flex: 1}}
              />
            ) : (
              <TextInput
                aria-label={t("containers.form.mounts.source", {n: index + 1})}
                placeholder="/srv/data"
                value={row.source}
                onChange={(event) =>
                  update(row.id, {source: event.currentTarget.value})
                }
                error={errorFor(index, "source")}
                dir="ltr"
                autoComplete="off"
                style={{flex: 1}}
              />
            )}
            <TextInput
              aria-label={t("containers.form.mounts.target", {n: index + 1})}
              placeholder="/var/lib/data"
              value={row.target}
              onChange={(event) =>
                update(row.id, {target: event.currentTarget.value})
              }
              error={errorFor(index, "target")}
              dir="ltr"
              autoComplete="off"
              style={{flex: 1}}
            />
            <RemoveRow
              label={t("containers.form.removeRow", {n: index + 1})}
              onClick={() => remove(row.id)}
              disabled={disabled}
            />
          </Group>
          <Checkbox
            label={t("containers.form.mounts.readOnly", {n: index + 1})}
            checked={row.readOnly}
            onChange={(event) =>
              update(row.id, {readOnly: event.currentTarget.checked})
            }
            disabled={disabled}
          />
        </Stack>
      ))}
    </RowList>
  );
}
