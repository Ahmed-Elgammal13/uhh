export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Fetch the static asset
    let response = await env.ASSETS.fetch(request);

    // Clone headers so we can modify them
    let headers = new Headers(response.headers);

    // Handle Brotli-compressed Unity files
    if (url.pathname.endsWith(".br")) {
      headers.set("Content-Encoding", "br");

      // Fix MIME types Unity expects
      if (url.pathname.endsWith(".js.br")) {
        headers.set("Content-Type", "application/javascript");
      } else if (url.pathname.endsWith(".wasm.br")) {
        headers.set("Content-Type", "application/wasm");
      } else if (url.pathname.endsWith(".data.br")) {
        headers.set("Content-Type", "application/octet-stream");
      }
    }

    return new Response(response.body, {
      status: response.status,
      headers
    });
  }
}
