import { Request, Response } from 'express';
import sinon, { SinonStubbedInstance } from 'sinon';
import chai from 'chai';
import nodeAssert from 'assert';

export const mockRequest = ({
  query,
  params,
  headers,
  body,
}: {
  query?: Record<string, unknown>;
  params?: Record<string, unknown>;
  headers?: Record<string, unknown>;
  body?: Record<string, unknown> | Buffer;
}) => {
  return {
    query,
    params,
    header: (key: string) => headers?.[key],
    body,
  } as unknown as Request;
};

export const mockResponse = ({
  status,
  header,
  send,
}: {
  status?: sinon.SinonStub;
  header?: sinon.SinonStub;
  send?: sinon.SinonStub;
} = {}) => {
  return {
    status: status ?? sinon.stub().returnsThis(),
    sendStatus: status ?? sinon.stub().returnsThis(),
    header: header ?? sinon.stub().returnsThis(),
    send: send ?? sinon.stub().returnsThis(),
  } as unknown as SinonStubbedInstance<Response>;
};

// We need to unwrap the handlers to test their logic (see asyncHandler in /lib/utils for details)
export const runHandler = async (handler: unknown) => {
  // eslint-disable-next-line @typescript-eslint/await-thenable
  await handler;
};

export const assert = { ...sinon.assert, ...chai.assert, ...nodeAssert };
