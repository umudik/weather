export abstract class WeatherService {
    abstract getWeather(location: string): Promise<number>;
    abstract getName(): string;
}
