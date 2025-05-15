import { All, Controller, Req, Res, Logger, UseFilters } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { firstValueFrom, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AllExceptionsFilter } from '../common/filters/all-exceptions.filter';

@Controller('/auth')
@UseFilters(AllExceptionsFilter)
export class AuthProxyController {
  private readonly logger = new Logger(AuthProxyController.name);
  private readonly authServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL');
    if (!this.authServiceUrl) {
      this.logger.error(
        'AUTH_SERVICE_URL is not defined in environment variables. Proxy will not work.',
      );
      throw new Error(
        'AUTH_SERVICE_URL is not defined in environment variables.',
      );
    }
  }

  @All('*')
  async proxyToAuthService(@Req() req: Request, @Res() res: Response) {
    const { method, originalUrl, body, headers: clientHeaders } = req;
    const targetPath = originalUrl.replace(/^\/auth/, '');
    const targetUrl = `${this.authServiceUrl}${targetPath}`;

    this.logger.log(
      `Proxying ${method} request from ${originalUrl} to Auth Service: ${targetUrl}`,
    );

    const headersToForward = { ...clientHeaders };
    delete headersToForward.host;
    delete headersToForward['content-length'];

    try {
      const serviceResponse = await firstValueFrom(
        this.httpService
          .request({
            method: method as any,
            url: targetUrl,
            data: body,
            headers: headersToForward,
          })
          .pipe(
            map((response) => response),
            catchError((error) => {
              this.logger.error(
                `Error from Auth Service (${targetUrl}) during request pipe: ${error.message}`,
                error.isAxiosError ? error.toJSON() : error.stack,
              );
              return throwError(() => error);
            }),
          ),
      );

      Object.keys(serviceResponse.headers).forEach((key) => {
        if (
          key.toLowerCase() !== 'transfer-encoding' &&
          key.toLowerCase() !== 'connection'
        ) {
          res.setHeader(key, serviceResponse.headers[key]);
        }
      });
      res.status(serviceResponse.status).send(serviceResponse.data);
    } catch (error) {
      this.logger.error(
        `Outer catch: Failed to proxy request to Auth Service (${targetUrl}): ${error.message}`,
        error.isAxiosError ? error.toJSON() : error.stack,
      );
      if (!res.headersSent && error instanceof Error) {
        throw error;
      }
    }
  }
}
