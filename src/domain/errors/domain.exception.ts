import { HttpException, HttpStatus } from "@nestjs/common";

export class DomainException extends HttpException {
    constructor(message: string, statusCode = HttpStatus.BAD_REQUEST) {
        super(message, statusCode);
    }
}
