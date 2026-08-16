export class ApiError extends Error {
  readonly httpStatus: number;
  readonly error: string;
  readonly fields?: string[];

  constructor(httpStatus: number, error: string, message: string, fields?: string[]) {
    super(message);
    this.httpStatus = httpStatus;
    this.error = error;
    this.fields = fields;
  }
}
