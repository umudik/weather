import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpStatus,
} from "@nestjs/common";
import { Response } from "express";
import {
    DomainError,
    InfrastructureError,
} from "../../domain/errors/service.error";

@Catch()
export class ServiceErrorFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        let status: number;
        let message: string;

        if (exception instanceof DomainError) {
            status = HttpStatus.BAD_REQUEST;
            message = exception.message;
        } else if (exception instanceof InfrastructureError) {
            status = HttpStatus.SERVICE_UNAVAILABLE;
            message = exception.message;
        } else {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            message = "Internal server error";
        }

        response.status(status).json({
            statusCode: status,
            message: message,
        });
    }
}
