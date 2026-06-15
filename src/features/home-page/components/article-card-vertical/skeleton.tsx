import {Card, Group, Box, Flex, Skeleton} from "@mantine/core";
import {IconClockHour2} from "@tabler/icons-react";
import classes from "./card.module.css";

export function VerticalArticleCardSkeleton() {
  return (
    <Card p={0} className={classes.card} radius="0">
      <Flex wrap="nowrap" gap={0} className={classes.group}>
        <Box className={classes.imageWrapper}>
          <Skeleton pos={"absolute"} w={"100%"} height={"100%"} />
        </Box>
        <Box className={classes.body}>
          <Skeleton h={12} w={"100%"} mb={"sm"} />
          <Skeleton h={12} w={"90%"} />
          <Group wrap="nowrap" gap={"sm"} mt={"auto"} justify="space-between">
            <Group wrap="nowrap" gap={"xs"}>
              <Skeleton circle h={40} w={40} />
              <Skeleton h={10} w={70} />
            </Group>
            <Group wrap="nowrap" gap={5} c={"dimmed"}>
              <IconClockHour2 spacing={0} size={20} />
              <Skeleton h={8} w={50} />
            </Group>
          </Group>
        </Box>
      </Flex>
    </Card>
  );
}
