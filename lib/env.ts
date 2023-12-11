
export const env = Object.freeze({
  SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL || unreachable("SLACK_WEBHOOK_URL"),
  IS_PRODUCTION: process.env.IS_PRODUCTION || unreachable("IS_PRODUCTION"),
  CLOUDFLARE_BUCKET_NAME: process.env.CLOUDFLARE_BUCKET_NAME || unreachable("CLOUDFLARE_BUCKET_NAME"),
  CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID || unreachable("CLOUDFLARE_ACCOUNT_ID"),
  CLOUDFLARE_ACCESS_KEY_ID: process.env.CLOUDFLARE_ACCESS_KEY_ID || unreachable("CLOUDFLARE_ACCESS_KEY_ID"),
  CLOUDFLARE_SECRET_ACCESS_KEY: process.env.CLOUDFLARE_SECRET_ACCESS_KEY || unreachable("CLOUDFLARE_SECRET_ACCESS_KEY"),
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || unreachable("AWS_ACCESS_KEY_ID"),
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || unreachable("AWS_SECRET_ACCESS_KEY"),
});

function unreachable(name: string): never {
  throw new Error(`${name} is not set in environment variable`);
}
