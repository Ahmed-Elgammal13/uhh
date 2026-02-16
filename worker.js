export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Serve Unity build files from R2 with proper headers
    if (pathname.startsWith("/Build/")) {
      const filename = decodeURIComponent(pathname.split('/').pop());
      const key = "Build/" + filename;
      
      const object = await env.R2.get(key);
      
      if (!object) {
        return new Response("Not found: " + key, { status: 404 });
      }

      const headers = new Headers();
      headers.set("Cache-Control", "public, max-age=31536000, immutable");

      if (filename.endsWith(".js.br")) {
        headers.set("Content-Type", "application/javascript");
        headers.set("Content-Encoding", "br");
      } else if (filename.endsWith(".wasm.br")) {
        headers.set("Content-Type", "application/wasm");
        headers.set("Content-Encoding", "br");
      } else if (filename.endsWith(".data.br")) {
        headers.set("Content-Type", "application/octet-stream");
        headers.set("Content-Encoding", "br");
      } else if (filename.endsWith(".loader.js")) {
        headers.set("Content-Type", "application/javascript");
        // No Content-Encoding - not compressed
      }

      return new Response(object.body, {
        headers,
        encodeBody: "manual"
      });
    }

    // Serve index.html from R2 root
    if (pathname === "/" || pathname === "/index.html") {
      const index = await env.R2.get("index.html");
      if (index) {
        return new Response(index.body, {
          headers: { "Content-Type": "text/html" }
        });
      }
      return new Response("index.html not found in R2", { status: 404 });
    }

    return new Response("Not found", { status: 404 });
  }
};
