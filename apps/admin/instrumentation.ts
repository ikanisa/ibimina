export async function register() {
  if (process.env.NODE_ENV === "production") {
    console.log("[instrumentation] boot");
  }
}
