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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validateResponseStatus = (response: Response, responseJson: any) => {
  if (response.status >= 400) {
    const apiErrorResponse = {
      status: response.status,
      message: responseJson?.error?.message,
    };

    throw new AiApiError(apiErrorResponse);
  }
};
