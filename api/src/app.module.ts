import { redisStore } from 'cache-manager-redis-yet';
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsController } from './products/products.controller';
import { ProductsModule } from './products/products.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products/products.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,
    CacheModule.registerAsync({
      useFactory: async () => ({
        store: await redisStore({
          socket: {
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
          }
        }),
      }),
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV === 'prod' ? false : true,
    }),
    ProductsModule,
  ],
  controllers: [AppController, ProductsController],
  providers: [
    AppService,
    ProductsService,
  ],
})
export class AppModule {}
