/* eslint-disable @typescript-eslint/no-explicit-any */

export interface Channel<T> {
  send(event: string, ...args: Array<any>): Promise<any>;
  call(channelName: T, methodName: string, args?: Array<any>): Promise<any>;
  addHandler<V>(channelName: T, callback: (value: V) => void): void;
}

const APP_METHOD = 'callAppMethod';

export class CustomAPIClient {
  constructor(private channel: Channel<typeof APP_METHOD>) {
    this.channel = channel;
  }

  static create(channel: Channel<typeof APP_METHOD>) {
    return new CustomAPIClient(channel);
  }

  install(parameters: any): Promise<any> {
    return this.channel.call('callAppMethod', 'install', [parameters]);
  }
}
