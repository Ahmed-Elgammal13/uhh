export default {
  async fetch(request, env) {
    // Serve all static files from the /public directory
    return env.ASSETS.fetch(request);
  }
}
