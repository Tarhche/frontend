import {type Metadata} from "next";
import {redirect} from "next/navigation";
import {Alert, Paper, Stack, Text, Title} from "@mantine/core";
import {AuthorizeForm} from "@/features/auth/components/authorize-form";
import {
  fetchAuthorizationRequest,
  type AuthorizationRequest,
} from "@/dal/public/oauth";
import {fetchUserProfile} from "@/dal/private/profile";
import {getDictionary} from "@/i18n/dictionary";
import {isUserTokenValid} from "@/lib/auth";
import {APP_PATHS} from "@/lib/app-paths";

export async function generateMetadata(props: {
  params: Promise<{lang: string}>;
}): Promise<Metadata> {
  const {lang} = await props.params;
  const {t} = getDictionary(lang);

  return {
    title: t("auth.authorize.metadataTitle"),
  };
}

type Props = {
  params: Promise<{lang: string}>;
  searchParams: Promise<{
    request?: string;
  }>;
};

// The page an application's request for a session is put to.
//
// The authorization endpoint sends the browser here with the request it read,
// signed. Nothing about it is taken from the url beyond that: what is shown
// comes back from the backend, where the signature is checked, and who is
// approving is whoever the session is for.
async function AuthorizePage(props: Props) {
  const {lang} = await props.params;
  const {t} = getDictionary(lang);

  const {request} = await props.searchParams;
  if (!request) {
    return (
      <Refusal
        title={t("auth.authorize.missingTitle")}
        body={t("auth.authorize.missing")}
      />
    );
  }

  // the answer is given as somebody, so somebody has to be here to give it.
  // The middleware has already had its chance to refresh.
  if (!(await isUserTokenValid("access-token"))) {
    redirect(
      `${APP_PATHS.auth.login}?callbackUrl=${encodeURIComponent(
        `${APP_PATHS.auth.authorize}?request=${request}`,
      )}`,
    );
  }

  let application: AuthorizationRequest;
  try {
    application = await fetchAuthorizationRequest(request);
  } catch {
    // a request that expired, or was never ours, describes nothing. Starting
    // again is the application's move, not this page's.
    return (
      <Refusal
        title={t("auth.authorize.expiredTitle")}
        body={t("auth.authorize.expired")}
      />
    );
  }

  const account = await profile();

  return (
    <AuthorizeForm
      request={request}
      application={{
        name: application.client_name,
        uri: application.client_uri,
        redirectUri: application.redirect_uri,
      }}
      account={account}
    />
  );
}

async function profile(): Promise<{name?: string; identity?: string}> {
  try {
    const user = (await fetchUserProfile()).data;

    return {name: user.name, identity: user.email ?? user.username};
  } catch {
    // whose session this is is worth saying and not worth failing over
    return {};
  }
}

function Refusal({title, body}: {title: string; body: string}) {
  return (
    <Paper withBorder shadow="md" p={30} radius="md">
      <Stack>
        <Title order={2} ta="center">
          {title}
        </Title>
        <Alert variant="light" color="red">
          <Text>{body}</Text>
        </Alert>
      </Stack>
    </Paper>
  );
}

export default AuthorizePage;
