// Browser requests use the same origin by default. In Vite development this
// goes through the HTTPS proxy; in Docker production it goes through Nginx.
const configuredApiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "");
const usesLocalApi = configuredApiUrl && /^https?:\/\/(localhost|127\.0\.0\.1)(?::\d+)?\/api$/i.test(configuredApiUrl);

export const API_ORIGIN = configuredApiUrl && !usesLocalApi
  ? configuredApiUrl.replace(/\/api$/, "")
  : "";

export const API_PREFIX = configuredApiUrl && !usesLocalApi ? configuredApiUrl : "/api";

export function apiUrl(path = "") {
  const suffix = path ? `/${path.replace(/^\/+/, "")}` : "";
  return `${API_PREFIX}${suffix}`;
}
