import {ReactNode} from "react";
import {Container, Stack, Title} from "@mantine/core";

type Props = {
  params: Promise<{
    hashtag?: string;
  }>;
  children: ReactNode;
};

async function HashtagsDetailLayout(props: Props) {
  const params = await props.params;
  const {children} = props;

  return (
    <Container size="sm" mt={50}>
      <Title>#{decodeURI(params.hashtag ?? "")}</Title>
      <Stack gap={"md"} mt={"lg"}>
        {children}
      </Stack>
    </Container>
  );
}

export default HashtagsDetailLayout;
