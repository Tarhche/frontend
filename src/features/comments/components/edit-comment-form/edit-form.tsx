"use client";
import {useActionState} from "react";
import {Group, Paper, Stack, Textarea, Alert, Button} from "@mantine/core";
import {DateTimeInput} from "@/components/date-time-input";
import {IconInfoCircle} from "@tabler/icons-react";
import {updateCommentAction} from "../../actions/update-comment";
import {isGregorianStartDateTime} from "@/lib/date-and-time";

type Props = {
  id: string;
  objectId: string;
  parentId: string;
  message: string;
  approvalDate: string;
};

export function EditCommentForm({
  message,
  approvalDate,
  parentId,
  id,
  objectId,
}: Props) {
  const [state, dispatch, isPending] = useActionState(updateCommentAction, {});

  return (
    <Paper withBorder p="xl">
      <form action={dispatch}>
        <Stack>
          <Textarea
            label="متن کامنت"
            name="message"
            rows={4}
            defaultValue={message}
          />
          <DateTimeInput
            valueFormat="DD MMM YYYY hh:mm A"
            placeholder="تاریخ انتشار را وارد کنید"
            label="تاریخ تایید"
            name="approvalDate"
            defaultValue={
              isGregorianStartDateTime(approvalDate) === true
                ? null
                : new Date(approvalDate)
            }
            clearable
          />
          {state.success === false && state.errorMessage && (
            <Alert
              title="عملیات با خطا مواجه شد"
              color="red"
              icon={<IconInfoCircle />}
            />
          )}
          <Group justify="flex-end" mt="md">
            <Button type="submit" loading={isPending}>
              {state.success === false ? "تلاش مجدد" : "ویرایش کامنت"}
            </Button>
          </Group>
          <input type="text" name="id" value={id} readOnly hidden />
          <input type="text" name="objectId" value={objectId} readOnly hidden />
          <input type="text" name="parentId" value={parentId} readOnly hidden />
        </Stack>
      </form>
    </Paper>
  );
}
