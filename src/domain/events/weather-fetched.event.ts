export class WeatherFetchedEvent {
    constructor(
        public readonly location: string,
        public readonly service1Name: string,
        public readonly service1Temperature: number,
        public readonly service2Name: string,
        public readonly service2Temperature: number,
        public readonly averageTemperature: number,
        public readonly requestCount: number,
        public readonly timestamp: Date = new Date(),
    ) {}
}
