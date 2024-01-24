export interface AiApiErrorType {
  message?: string;
  status?: number;
}

export class AiApiError extends Error {
  status: number;

  constructor(res: AiApiErrorType) {
    super(res.message);
    this.status = res.status ?? 0;
  }
}
