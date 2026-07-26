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
  };
};

export type AuthState = Authenticated | UnAuthenticated;
