import {ReactNode} from "react";
import {Container, Stack, Title} from "@mantine/core";

type Props = {
  children: ReactNode;
};

function ArticlesLayout(props: Props) {
  const {children} = props;

  return (
    <Container size="sm" mt={50}>
      <Title>مقاله ها</Title>
      <Stack gap={"md"} mt={"lg"}>
        {children}
      </Stack>
    </Container>
  );
}

export default ArticlesLayout;
