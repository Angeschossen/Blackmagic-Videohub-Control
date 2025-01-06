
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const backend = await import("./app/backend/backend")
    console.log("Setting up...")
    await backend.setup()
    console.log("Setup completed.")
  }
}