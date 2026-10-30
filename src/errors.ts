/** Vereel answered, and the answer was an error (or not the JSON it promises). */
export class VereelApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly details: Record<string, unknown> = {},
    readonly retryAfter: number | null = null
  ) {
    super(message);
    this.name = "VereelApiError";
  }
}

/** The request never got an answer: no connection, or it took too long. */
export class VereelNetworkError extends Error {
  constructor(message: string, readonly timedOut: boolean) {
    super(message);
    this.name = "VereelNetworkError";
  }
}

/** A tool that needs a brand token was called on a server that has none. */
export class MissingTokenError extends Error {
  constructor() {
    super("This needs a Vereel brand API token.");
    this.name = "MissingTokenError";
  }
}

/** Something the model asked for cannot be done on this machine (a local file that is not usable, an empty change). Nothing was sent. */
export class LocalInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LocalInputError";
  }
}
