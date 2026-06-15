import {ReactNode} from "react";
import {Container, Stack, Title} from "@mantine/core";
import {getServerDictionary} from "@/i18n/server";

type Props = {
  children: ReactNode;
};

async function ArticlesLayout(props: Props) {
  const {children} = props;
  const {t} = await getServerDictionary();

  return (
    <Container size="sm" mt={50}>
      <Title>{t("articles.list.title")}</Title>
      <Stack gap={"md"} mt={"lg"}>
        {children}
      </Stack>
    </Container>
  );
}

export default ArticlesLayout;
