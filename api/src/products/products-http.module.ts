import { Module } from '@nestjs/common';
import { ProductsModule } from './products.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [ProductsModule, HttpModule,],
    providers: [ProductsService],
    controllers: [ProductsController],
})
export class ProductsHttpModule {}

