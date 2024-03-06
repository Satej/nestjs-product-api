import { IsString, IsNumber, IsBoolean, } from 'class-validator';

export class CreateProductDto {
    @IsString() name: string;
    @IsNumber() price: number;
    @IsString() description: string;
    @IsNumber() viewCount: number;
    @IsBoolean() isDeleted: boolean;
}