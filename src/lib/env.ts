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
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiProductAssistantModel: process.env.GEMINI_PRODUCT_ASSISTANT_MODEL ?? "gemini-3.8-flash",
  groqApiKey: process.env.GROQ_API_KEY,
  groqTextModel: process.env.GROQ_TEXT_MODEL ?? "qwen/qwen3.8-27b",
  groqVisionModel: process.env.GROQ_VISION_MODEL ?? "qwen/qwen3.8-27b"
} as const;
