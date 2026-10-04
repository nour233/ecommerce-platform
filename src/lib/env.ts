const smtpPort = Number.parseInt(process.env.SMTP_PORT ?? "587", 10);
const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be configured in the environment");
}

export const env = {
  awsRegion: process.env.AWS_REGION ?? "us-east-1",
  tableName: process.env.DYNAMODB_TABLE_NAME ?? "CommerceCraft",
  sessionSecret,
  useMockDb: process.env.USE_MOCK_DB === "true",
  dynamodbEndpoint: process.env.DYNAMODB_ENDPOINT || undefined,
  smtpHost: process.env.SMTP_HOST,
  smtpPort: Number.isInteger(smtpPort) ? smtpPort : 587,
  smtpSecure: process.env.SMTP_SECURE === "true",
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  mailFrom: process.env.MAIL_FROM,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  anthropicTextModel: process.env.ANTHROPIC_TEXT_MODEL ?? "claude-haiku-4-5-20251001",
  anthropicVisionModel: process.env.ANTHROPIC_VISION_MODEL ?? "claude-haiku-4-5-20251001",
  groqApiKey: process.env.GROQ_API_KEY,
  groqTextModel: process.env.GROQ_TEXT_MODEL ?? "qwen/qwen3.8-27b",
  groqVisionModel: process.env.GROQ_VISION_MODEL ?? "qwen/qwen3.8-27b"
} as const;
