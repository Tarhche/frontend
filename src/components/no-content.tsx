import {Title, Text, Container} from "@mantine/core";
import {IconInbox} from "@tabler/icons-react";
import classes from "./no-content.module.css";

type Props = {
  title?: string;
  text?: string;
};

export function NoContent({title, text}: Props) {
  return (
    <Container className={classes.root}>
      <IconInbox className={classes.icon} stroke={1.25} />
      <Title className={classes.title}>
        {title ?? "هنوز محتوایی منتشر نشده"}
      </Title>
      <Text c="dimmed" size="lg" ta="center" className={classes.description}>
        {text ??
          "در حال حاضر هیچ مقاله‌ای منتشر نشده است. لطفاً بعداً دوباره سر بزنید."}
      </Text>
    </Container>
  );
}
