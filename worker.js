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
      headers.set("Cache-Control", "no-cache");

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

    // Serve other static files from R2
    if (pathname.startsWith("/TemplateData/") || 
        pathname.startsWith("/StreamingAssets/") ||
        pathname === "/manifest.webmanifest" ||
        pathname === "/ServiceWorker.js") {
      
      const key = pathname.startsWith("/") ? pathname.slice(1) : pathname;
      const object = await env.R2.get(key);
      
      if (object) {
        const headers = new Headers();
        headers.set("Content-Type", getContentType(pathname));
        headers.set("Cache-Control", "no-cache");
        return new Response(object.body, { headers });
      }
      return new Response("Not found", { status: 404 });
    }

    // Serve index.html with "hi" at the bottom
    if (pathname === "/" || pathname === "/index.html") {
      const index = await env.R2.get("index.html");
      if (index) {
        let html = await index.text();
        
        // Add "hi" text at the bottom
        html = html.replace('</body>', `
  <div style="position:fixed;bottom:10px;left:10px;color:gray;font-family:sans-serif;z-index:9999;">i fixed everything, so enjoy, and this was made by AHMED, like the noncholant arab..</div>
</body>`);
        
        // Remove original ServiceWorker registration
        html = html.replace(/if\s*\(\s*"serviceWorker"\s*in\s*navigator\s*\)\s*\{\s*navigator\.serviceWorker\.register\([^)]+\);\s*\}/, '');
        
        return new Response(html, {
          headers: { 
            "Content-Type": "text/html",
            "Cache-Control": "no-cache"
          }
        });
      }
      return new Response("index.html not found", { status: 404 });
    }

    return new Response("Not found", { status: 404 });
  }
};

function getContentType(path) {
  if (path.endsWith('.css')) return 'text/css';
  if (path.endsWith('.js')) return 'application/javascript';
  if (path.endsWith('.ico')) return 'image/x-icon';
  if (path.endsWith('.json')) return 'application/json';
  if (path.endsWith('.webmanifest')) return 'application/manifest+json';
  return 'application/octet-stream';
}
