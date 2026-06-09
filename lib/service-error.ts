/** Domain error carrying an HTTP status, thrown by services and mapped to
 *  responses by the API route handlers. */
export class ServiceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "ServiceError";
    this.status = status;
  }
}

export const notFound = (what: string) => new ServiceError(`${what} not found`, 404);

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
export const isValidEmail = (e: string) => EMAIL_RE.test(e);
