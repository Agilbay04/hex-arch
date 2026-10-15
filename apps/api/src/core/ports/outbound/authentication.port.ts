export type AuthenticatedPrincipal = Readonly<{
  userId: string;
  roles: readonly string[];
}>;

export interface AuthenticationPort {
  authenticate(token: string): Promise<AuthenticatedPrincipal | null>;
}

export const AUTHENTICATION_PORT = Symbol('AUTHENTICATION_PORT');
