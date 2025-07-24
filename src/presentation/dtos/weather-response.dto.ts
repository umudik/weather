import { ApiProperty } from "@nestjs/swagger";
import { BaseClass } from "../../domain/common/base-class";

export class WeatherResponseDto extends BaseClass {
    @ApiProperty({
        description: "Location name",
        example: "Istanbul",
    })
    location: string;

    @ApiProperty({
        description: "Average temperature in Celsius",
        example: 22.5,
    })
    temperature: number;
}
