export class InfrastructureError extends Error {
    public readonly code: string;
    public readonly statusCode: number;

    constructor(
        message: string,
        code: string = "INFRASTRUCTURE_ERROR",
        statusCode: number = 500,
    ) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.statusCode = statusCode;
    }
}

export class WeatherServiceError extends InfrastructureError {
    public readonly location: string;

    constructor(message: string, location: string, statusCode: number = 503) {
        super(
            `Weather service failed for ${location}: ${message}`,
            "WEATHER_SERVICE_ERROR",
            statusCode,
        );
        this.location = location;
    }
}

export class DomainError extends Error {
    public readonly code: string;
    public readonly statusCode: number = 400;

    constructor(message: string, code: string) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
    }
}

export class LocationNotFoundError extends DomainError {
    constructor() {
        super(`Location not found`, "LOCATION_NOT_FOUND");
    }
}
