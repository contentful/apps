export type WizardRoutesType = {
  overviewRoute: string,
  authCredentialsRoute: string,
  enableApiRoute: string,
  serviceAccountRoute: string,
}

export const ROUTE_PATHS = {
  overviewRoute: "/",
  authCredentialsRoute: "/auth-cred",
  enableApiRoute: "/enable-api",
  serviceAccountRoute: "/service-account",
} as WizardRoutesType