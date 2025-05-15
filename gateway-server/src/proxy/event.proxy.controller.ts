import {
  All,
  Controller,
  Req,
  Res,
  Logger,
  UseGuards,
  UseFilters,
  Get,
  Post,
  Patch,
  Put,
  Delete,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { firstValueFrom, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AllExceptionsFilter } from '../common/filters/all-exceptions.filter';
import { AuthenticatedUser } from '../auth/auth-user.decorator';

@Controller(['/events', '/rewards', '/reward-requests'])
@UseGuards(JwtAuthGuard)
@UseFilters(AllExceptionsFilter)
export class EventProxyController {
  private readonly logger = new Logger(EventProxyController.name);
  private readonly eventServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.eventServiceUrl = this.configService.get<string>('EVENT_SERVICE_URL');
    if (!this.eventServiceUrl) {
      this.logger.error(
        'EVENT_SERVICE_URL is not defined in environment variables. Proxy will not work.',
      );
      throw new Error(
        'EVENT_SERVICE_URL is not defined in environment variables.',
      );
    }
  }

  private async doProxy(req: Request, res: Response) {
    const { method, originalUrl, body, headers: clientHeaders } = req;
    const user = req.user as AuthenticatedUser;
    const targetUrl = `${this.eventServiceUrl}${originalUrl}`;

    this.logger.log(
      `Proxying ${method} request from ${originalUrl} to Event Service: ${targetUrl}`,
    );

    const headersToForward: Record<string, string | string[]> = {
      ...clientHeaders,
    };
    delete headersToForward.host;
    delete headersToForward['content-length'];
    delete headersToForward['connection'];

    if (user) {
      this.logger.debug(
        `Authenticated user for proxy to Event Service: userId=${user.userId}, username=${user.username}, roles=${user.roles.join(',')}`,
      );
      headersToForward['x-user-id'] = user.userId;
      headersToForward['x-username'] = user.username;
      headersToForward['x-user-roles'] = user.roles.join(',');
    } else {
      this.logger.warn(
        `No authenticated user found in request to ${originalUrl} for Event Service. This might be an issue if the downstream service expects user context.`,
      );
    }

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
                `Error from Event Service (${targetUrl}) during request pipe: ${error.message}`,
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
        `Outer catch: Failed to proxy request to Event Service (${targetUrl}): ${error.message}`,
        error.isAxiosError ? error.toJSON() : error.stack,
      );
      throw error;
    }
  }

  @Get()
  getBase(@Req() req: Request, @Res() res: Response) {
    this.logger.verbose(
      `EventProxyController: GET base path ${req.originalUrl}`,
    );
    return this.doProxy(req, res);
  }

  @Post()
  postBase(@Req() req: Request, @Res() res: Response) {
    this.logger.verbose(
      `EventProxyController: POST base path ${req.originalUrl}`,
    );
    return this.doProxy(req, res);
  }

  @Put()
  putBase(@Req() req: Request, @Res() res: Response) {
    this.logger.verbose(
      `EventProxyController: PUT base path ${req.originalUrl}`,
    );
    return this.doProxy(req, res);
  }

  @Patch()
  patchBase(@Req() req: Request, @Res() res: Response) {
    this.logger.verbose(
      `EventProxyController: PATCH base path ${req.originalUrl}`,
    );
    return this.doProxy(req, res);
  }

  @Delete()
  deleteBase(@Req() req: Request, @Res() res: Response) {
    this.logger.verbose(
      `EventProxyController: DELETE base path ${req.originalUrl}`,
    );
    return this.doProxy(req, res);
  }

  @All(':path(.*)')
  allSubPaths(@Req() req: Request, @Res() res: Response) {
    this.logger.verbose(
      `EventProxyController: ALL sub-path ${req.originalUrl}`,
    );
    return this.doProxy(req, res);
  }
}
