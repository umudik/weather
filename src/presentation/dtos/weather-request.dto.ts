import { ApiProperty } from "@nestjs/swagger";
import { BaseClass } from "../../domain/common/base-class";
import { IsNotEmpty, IsString } from "class-validator";

export class WeatherRequestDto extends BaseClass {
    @ApiProperty({
        description: "Location to get weather for",
        example: "Istanbul",
    })
    @IsString()
    @IsNotEmpty()
    q: string;
}
