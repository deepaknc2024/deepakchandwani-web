const PROXIES = [
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) =>
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) =>
    `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
];

export async function proxyFetch(
  targetUrl: string,
  opts: RequestInit = {},
  attempt = 0
): Promise<Response> {
  if (attempt >= PROXIES.length) throw new Error("PROXY_FAIL");
  try {
    const resp = await fetch(PROXIES[attempt](targetUrl), {
      ...opts,
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp;
  } catch (e) {
    if (e instanceof Error && e.message === "PROXY_FAIL") throw e;
    return proxyFetch(targetUrl, opts, attempt + 1);
  }
}

export const CORS_PROXIES = PROXIES;
