// Error domain — tidak bergantung framework atau Supabase.
export class DomainError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "DomainError";
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super("validation_error", message);
  }
}

export class AuthError extends DomainError {
  constructor(message: string) {
    super("auth_error", message);
  }
}
