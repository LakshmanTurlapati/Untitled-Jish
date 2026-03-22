/**
 * Environment variable validation utility.
 * Provides clear, actionable error messages when required env vars are missing.
 */

/**
 * Read and validate a required environment variable.
 *
 * @param name - The environment variable name (e.g., "XAI_API_KEY")
 * @returns The value of the environment variable
 * @throws Error with a clear message naming the missing variable
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} environment variable is not set. Set it in .env.local or your deployment environment.`
    );
  }
  return value;
}
