type UnAuthenticated = {
  status: "unauthenticated";
};

type Authenticated = {
  status: "authenticated";
  permissions: string[];
  profile: {
    avatar: string;
    email: string;
    name: string;
    username: string;
    uuid: string;
    // who is seeing the site as this user, when somebody is. Absent from an
    // ordinary session.
    impersonated_by?: {
      uuid: string;
      name?: string;
      username?: string;
      avatar?: string;
    };
  };
};

export type AuthState = Authenticated | UnAuthenticated;
