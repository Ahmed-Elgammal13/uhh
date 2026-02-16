export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // Debug: Show what path is being requested
    if (pathname.includes("framework")) {
      return new Response(
        `Worker is running!\nPath: ${pathname}\nR2 binding exists: ${!!env.R2}`, 
        { headers: { "Content-Type": "text/plain" } }
      );
    }

    // Normal handling for other paths
    if (pathname.startsWith("/Build/")) {
      const filename = pathname.split('/').pop();
      const key = "Build/" + filename;
      
      if (!env.R2) {
        return new Response("ERROR: R2 binding not found", { status: 500 });
      }
      
      const object = await env.R2.get(key);
      
      if (!object) {
        return new Response(`File not found in R2: ${key}`, { status: 404 });
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
      }

      return new Response(object.body, {
        headers,
        encodeBody: "manual"
      });
    }

    return env.ASSETS.fetch(request);
  }
};
