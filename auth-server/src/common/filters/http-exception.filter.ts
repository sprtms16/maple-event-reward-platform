import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const errorResponse = exception.getResponse();

    let message: string | string[];
    let errorName = exception.constructor.name;

    if (typeof errorResponse === 'string') {
      message = errorResponse;
    } else if (
      typeof errorResponse === 'object' &&
      errorResponse !== null &&
      'message' in errorResponse
    ) {
      message = (errorResponse as any).message;
      if ((errorResponse as any).error) {
        errorName = (errorResponse as any).error;
      }
    } else {
      message = 'Internal server error';
    }

    this.logger.error(
      `HTTP Status: ${status} Error Message: ${JSON.stringify(message)} Path: ${request.url} Method: ${request.method}`,
      exception.stack,
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: errorName,
      message: message,
    });
  }
}
