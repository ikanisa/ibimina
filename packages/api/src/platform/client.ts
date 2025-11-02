import createClient, { type ClientOptions } from "openapi-fetch";

import type { paths as PlatformApiPaths } from "../generated/platform-api.js";

export type { PlatformApiPaths };

export type PlatformApiClient = ReturnType<typeof createPlatformApiClient>;

export interface PlatformApiClientOptions extends ClientOptions<PlatformApiPaths> {}

export const createPlatformApiClient = (options: PlatformApiClientOptions = {}) =>
  createClient<PlatformApiPaths>({
    baseUrl: "https://platform-api.ibimina.rw",
    ...options,
  });
