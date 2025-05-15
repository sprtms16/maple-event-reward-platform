import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { AxiosError } from 'axios';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Internal server error';
    let errorName = 'InternalServerError';

    this.logger.error(
      `Unhandled Exception: Path: ${request.url}, Method: ${request.method}, ${request.address}`,
      (exception as Error)?.stack,
      (exception as Error)?.constructor?.name,
    );

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse();
      message =
        typeof errorResponse === 'string'
          ? errorResponse
          : (errorResponse as any).message || errorResponse;
      errorName = exception.constructor.name;
      this.logger.error(
        `HttpException: Status: ${status}, Message: ${JSON.stringify(message)}, ErrorName: ${errorName}`,
      );
    } else if ((exception as AxiosError)?.isAxiosError) {
      const axiosError = exception as AxiosError;
      this.logger.error(
        `AxiosError during proxy to ${axiosError.config?.url}: ${axiosError.message}`,
        axiosError.stack,
      );
      status = axiosError.response?.status || HttpStatus.SERVICE_UNAVAILABLE;

      const serviceErrorData = axiosError.response?.data;
      if (typeof serviceErrorData === 'string') {
        message = serviceErrorData;
      } else if (
        typeof serviceErrorData === 'object' &&
        serviceErrorData !== null &&
        'message' in serviceErrorData
      ) {
        message = (serviceErrorData as any).message;
        if ((serviceErrorData as any).error)
          errorName = (serviceErrorData as any).error;
        else errorName = 'DownstreamServiceError';
      } else if (axiosError.message) {
        message = `Error connecting to downstream service: ${axiosError.message}`;
      } else {
        message = 'Error connecting to downstream service.';
      }
      if (status === HttpStatus.SERVICE_UNAVAILABLE && !axiosError.response)
        errorName = 'ServiceUnavailable';
      else if (!errorName || errorName === 'InternalServerError')
        errorName = 'ProxyError';

      this.logger.error(
        `AxiosError Details: Status: ${status}, Message: ${JSON.stringify(message)}, ErrorName: ${errorName}`,
      );
    } else if (exception instanceof Error) {
      message = exception.message;
      errorName = exception.name;
      this.logger.error(
        `Generic Error: Message: ${message}, ErrorName: ${errorName}`,
      );
    }

    const responseBody = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: errorName,
      message: message,
    };

    if (httpAdapter && httpAdapter.reply) {
      httpAdapter.reply(response, responseBody, status);
    } else {
      this.logger.warn(
        'HttpAdapter not available or reply method missing. Using direct response.send().',
      );
      if (
        typeof response.status === 'function' &&
        typeof response.send === 'function'
      ) {
        response.status(status).send(responseBody);
      } else {
        this.logger.error(
          'Cannot send response: response.status or response.send is not a function. This may cause client to hang.',
        );
      }
    }
  }
}
