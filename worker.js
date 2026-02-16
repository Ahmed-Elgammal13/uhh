export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Test if Worker runs at all
    if (url.pathname === "/test") {
      return new Response("Worker is running! R2 exists: " + !!env.R2);
    }
    
    // Test R2 access
    if (url.pathname === "/test-r2") {
      const obj = await env.R2.get("Build/Five Nights At SRMS.framework.js.br");
      return new Response("R2 object found: " + !!obj);
    }
    
    // Your normal Unity handling
    if (url.pathname.startsWith("/Build/")) {
      const filename = url.pathname.split('/').pop();
      const key = "Build/" + filename;
      const object = await env.R2.get(key);
      
      if (!object) return new Response("Not found", {status: 404});
      
      const headers = new Headers();
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
      
      return new Response(object.body, {headers, encodeBody: "manual"});
    }
    
    // Serve index.html from R2 root
    if (url.pathname === "/" || url.pathname === "/index.html") {
      const index = await env.R2.get("index.html");
      if (index) {
        return new Response(index.body, {headers: {"Content-Type": "text/html"}});
      }
      return new Response("index.html not found in R2", {status: 404});
    }
    
    return new Response("Not found", {status: 404});
  }
};
