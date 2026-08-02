import {Container} from "@mantine/core";
import {ContentSkeleton} from "@/features/notes/components/note-detail";

function NoteLoading() {
  return (
    <Container component="section" px={{base: "0", sm: "md"}} size="sm" mt="xl">
      <ContentSkeleton />
    </Container>
  );
}

export default NoteLoading;
