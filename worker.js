export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Debug: Log all requests to /Build/
    if (pathname.startsWith("/Build/")) {
      const filename = decodeURIComponent(pathname.split('/').pop());
      const key = "Build/" + filename;
      
      const object = await env.R2.get(key);
      
      if (!object) {
        return new Response("DEBUG: Not found in R2: " + key, { status: 404 });
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

      // DEBUG: Return headers as text instead of file
      return new Response(
        `DEBUG INFO:\n` +
        `Filename: ${filename}\n` +
        `R2 Key: ${key}\n` +
        `Object size: ${object.size}\n` +
        `Headers being sent:\n` +
        [...headers.entries()].map(([k,v]) => `  ${k}: ${v}`).join('\n'),
        { headers: { "Content-Type": "text/plain" } }
      );
    }

    // Serve index.html with debug script added
    if (pathname === "/" || pathname === "/index.html") {
      const index = await env.R2.get("index.html");
      if (index) {
        let html = await index.text();
        
        // Add debug script before </body>
        const debugScript = `
<script>
window.addEventListener('error', function(e) {
  alert('ERROR: ' + e.message + '\\nFile: ' + e.filename);
});
// Test fetch to see headers
fetch('Build/Five Nights At SRMS.framework.js.br')
  .then(r => alert('Fetch status: ' + r.status + '\\nContent-Encoding: ' + r.headers.get('content-encoding')))
  .catch(e => alert('Fetch error: ' + e));
</script>`;
        
        html = html.replace('</body>', debugScript + '</body>');
        
        return new Response(html, {
          headers: { "Content-Type": "text/html" }
        });
      }
      return new Response("index.html not found in R2", { status: 404 });
    }

    return new Response("Not found", { status: 404 });
  }
};
