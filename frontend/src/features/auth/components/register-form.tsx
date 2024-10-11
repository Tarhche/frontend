"use client";
import {useFormState} from "react-dom";
import Link from "next/link";
import {
  TextInput,
  Anchor,
  Paper,
  Title,
  Text,
  Container,
  Alert,
} from "@mantine/core";
import {FormButton} from "@/components/form-button";
import {IconInfoCircle} from "@tabler/icons-react";
import {registerUser} from "../actions/register-user";

export function RegisterForm() {
  const [state, dispatch] = useFormState(registerUser, {
    success: undefined,
  });

  const renderFeedbackAlert = () => {
    switch (state.success) {
      case undefined:
        return null;
      case true:
        return (
          <Alert
            variant="filled"
            color="green"
            title="عملیات موفق"
            mt={"sm"}
            icon={<IconInfoCircle />}
          >
            لینک ثبت نام برای شما ارسال شد. لطفا ایمیل خود را بررسی کنید.
          </Alert>
        );
      case false:
        return (
          <Alert
            variant="filled"
            color="red"
            title="عملیات ناموفق"
            mt={"sm"}
            icon={<IconInfoCircle />}
          >
            {state.errorMessage}
          </Alert>
        );
    }
  };

  return (
    <Container size={500} my={80}>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <Title ta="center">خوش آمدید</Title>
        <Text c="dimmed" size="sm" ta="center" mt={5}>
          از قبل حساب دارید؟{" "}
          <Anchor size="sm" component={Link} href={"/auth/login"}>
            وارد شوید
          </Anchor>
        </Text>
        <form action={dispatch}>
          <TextInput
            label="ایمیل"
            placeholder="you@email.com"
            name="email"
            mt={"md"}
            required
            disabled={state.success}
          />
          {renderFeedbackAlert()}
          {(state.success === false || state.success === undefined) && (
            <FormButton mt="sm" type="submit" fullWidth>
              ثبت نام
            </FormButton>
          )}
        </form>
      </Paper>
    </Container>
  );
}
