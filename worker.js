export default {
  async fetch(request, env) {
    let response = await env.ASSETS.fetch(request);

    // Clone the response so we can modify headers
    let newHeaders = new Headers(response.headers);

    const url = new URL(request.url);

    // Add Brotli header for .br files
    if (url.pathname.endsWith(".br")) {
      newHeaders.set("Content-Encoding", "br");

      // Unity expects correct MIME types too
      if (url.pathname.endsWith(".js.br")) {
        newHeaders.set("Content-Type", "application/javascript");
      }
      if (url.pathname.endsWith(".wasm.br")) {
        newHeaders.set("Content-Type", "application/wasm");
      }
      if (url.pathname.endsWith(".data.br")) {
        newHeaders.set("Content-Type", "application/octet-stream");
      }
    }

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders
    });
  }
}
