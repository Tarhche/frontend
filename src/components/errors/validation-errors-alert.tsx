import {Alert, List, ListItem, type MantineSpacing} from "@mantine/core";
import {IconInfoCircle} from "@tabler/icons-react";

type Props = {
  errors?: string[];
  title?: string;
  mt?: MantineSpacing;
};

export function ValidationErrorsAlert({
  errors = [],
  title = "خطای اعتبارسنجی",
  mt = "sm",
}: Props) {
  const visible = errors.filter(Boolean);
  if (visible.length === 0) return null;

  return (
    <Alert
      variant="filled"
      color="red"
      title={title}
      icon={<IconInfoCircle />}
      mt={mt}
    >
      {visible.length === 1 ? (
        visible[0]
      ) : (
        <List size="sm" withPadding>
          {visible.map((err) => (
            <ListItem key={err}>{err}</ListItem>
          ))}
        </List>
      )}
    </Alert>
  );
}
