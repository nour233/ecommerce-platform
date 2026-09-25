import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode = 500,
    public code = "INTERNAL_ERROR"
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const toErrorResponse = (error: unknown) => {
  if (error instanceof ZodError) {
    return Response.json(
      { error: "Invalid request data", code: "VALIDATION_ERROR", details: error.flatten() },
      { status: 400 }
    );
  }

  if (error instanceof AppError) {
    return Response.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }

  if (error instanceof SyntaxError) {
    return Response.json(
      { error: "Request body must contain valid JSON", code: "INVALID_JSON" },
      { status: 400 }
    );
  }

  const databaseErrorNames = new Set([
    "AccessDeniedException",
    "CredentialsProviderError",
    "InternalServerError",
    "ProvisionedThroughputExceededException",
    "ResourceNotFoundException",
    "ThrottlingException",
    "UnrecognizedClientException"
  ]);
  if (error instanceof Error && databaseErrorNames.has(error.name)) {
    console.error(error);
    return Response.json(
      { error: "The database is temporarily unavailable", code: "DATABASE_UNAVAILABLE" },
      { status: 503 }
    );
  }

  console.error(error);
  return Response.json(
    { error: "Something went wrong. Please try again.", code: "INTERNAL_ERROR" },
    { status: 500 }
  );
};
