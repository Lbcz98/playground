// Loads .env before any other module reads process.env — main.ts imports this first.
try {
  process.loadEnvFile()
} catch {
  // No .env: the environment is used as it is.
}
