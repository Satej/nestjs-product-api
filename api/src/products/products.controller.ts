import { Controller, Get, Post, Delete, Param, Body, ParseIntPipe, HttpException, HttpStatus, Query, HttpCode } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { Currency } from './product.currency.model';

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) {}

    @Post()
    async createProduct(@Body() createProductDto: CreateProductDto) {
        const product = await this.productsService.create(createProductDto);

        if (!product) {
            throw new HttpException('Internal Error', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        product["currency"] = Currency.USD;
        return product;
    }

    @Get('most-viewed')
    async getMostViewedProducts(
        @Query('limit') limit: number = 5,
        @Query('currency') currency: Currency = Currency.USD
    ) {
        const products = await this.productsService.getMostViewedProducts(limit, currency);

        if (!products) {
            throw new HttpException('Internal Error', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return products;
    }

    @Get(':id')
    async getProduct(
        @Param('id', ParseIntPipe) id: number,
        @Query('currency') currency: Currency = Currency.USD
    ) {
        const product = await this.productsService.findOne(id, currency);
        
        if (product === HttpStatus.NOT_FOUND) {
            throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
        } else if (!product) {
            throw new HttpException('Internal Error', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        const result = await this.productsService.increaseViewCount(product);

        if (!result) {
            throw new HttpException('Internal Error', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        product["currency"] = currency || Currency.USD;

        return product;
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteProduct(@Param('id', ParseIntPipe) id: number) {
        const isDeleted = await this.productsService.remove(id);

        if (!isDeleted) {
            throw new HttpException('Internal Error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}