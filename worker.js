export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Serve Unity build files from R2
    if (pathname.startsWith("/Build/")) {
      const filename = pathname.split('/').pop();
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
      }

      return new Response(object.body, {
        headers,
        encodeBody: "manual"
      });
    }

    // Serve index.html and other static files from R2 (move them there)
    // For now, return simple HTML
    if (pathname === "/" || pathname === "/index.html") {
      // Option A: Move index.html to R2 and serve it
      const index = await env.R2.get("index.html");
      if (index) {
        return new Response(index.body, {
          headers: { "Content-Type": "text/html" }
        });
      }
      
      // Option B: Hardcode basic HTML for testing
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Five Nights At SRMS</title>
          <style>body { margin: 0; overflow: hidden; background: #000; }</style>
        </head>
        <body>
          <canvas id="unity-canvas"></canvas>
          <script src="Build/Five Nights At SRMS.loader.js"></script>
          <script>
            createUnityInstance(document.querySelector("#unity-canvas"), {
              dataUrl: "Build/Five Nights At SRMS.data.br",
              frameworkUrl: "Build/Five Nights At SRMS.framework.js.br",
              codeUrl: "Build/Five Nights At SRMS.wasm.br",
              streamingAssetsUrl: "StreamingAssets",
              companyName: "DefaultCompany",
              productName: "Five Nights At SRMS",
              productVersion: "1.0",
            });
          </script>
        </body>
        </html>
      `, { headers: { "Content-Type": "text/html" } });
    }

    return new Response("Not found", { status: 404 });
  }
};
