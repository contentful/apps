import {
  AccessDeniedException,
  InternalServerException,
  ModelErrorException,
  ModelNotReadyException,
  ModelStreamErrorException,
  ModelTimeoutException,
  ResourceNotFoundException,
  ServiceQuotaExceededException,
  ThrottlingException,
  ValidationException,
} from "@aws-sdk/client-bedrock-runtime";

export interface AiApiErrorType {
  message?: string;
  status?: number;
}

export type AiErrorType =
  | AccessDeniedException
  | InternalServerException
  | ModelErrorException
  | ModelNotReadyException
  | ModelTimeoutException
  | ResourceNotFoundException
  | ServiceQuotaExceededException
  | ThrottlingException
  | ValidationException
  | ModelStreamErrorException
  | Error;

// export class AiApiError extends Error {
//   status: number;

//   constructor(res: AiApiErrorType) {
//     super(res.message);
//     this.status = res.status ?? 0;
//   }
// }
