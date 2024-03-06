import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Currency } from './product.currency.model';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(Product)
        private readonly productsRepository: Repository<Product>,
        @Inject(CACHE_MANAGER)
        private cacheManager: any,
        private readonly httpService: HttpService,
    ) {}

    create(createProductDto: CreateProductDto): Promise<Product> {
        const product = new Product();
        product.name = createProductDto.name;
        product.price = createProductDto.price;
        product.description = createProductDto.description;
        
        try {
            return this.productsRepository.save(product);
        } catch (e) {
            console.log(e);
            return null;
        }
        
    }
    
    async findOne(id: number, currency: Currency): Promise<Product | null | HttpStatus.NOT_FOUND> {
        try {
            const products: Product[] = await this.productsRepository.find({ where: { isDeleted: false, id } });

            if (products.length === 0) {
                return HttpStatus.NOT_FOUND;
            }

            let product = products[0];

            if (currency !== Currency.USD) {
                product = await this.applyExchangeRate(currency, product);
            }
            
            return product;
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    private async applyExchangeRate(currency: Currency, product: Product): Promise<Product> {
        let exchangeRate = 1;

        try {
            exchangeRate = await this.getExchangeRate(currency);
        } catch (e) {
            console.log(e);
            exchangeRate = 1;
        }
        
        product.price = parseFloat((product.price * exchangeRate).toFixed(2));
        return product;
    }

    private async getExchangeRate(priceCurrency: Currency): Promise<any> {
        const keyPrefix = 'exchange_rate_';
        const exchangeKey = `${keyPrefix}${priceCurrency}`;
        let currencyExchangeRate = null;

        try {
            currencyExchangeRate = await this.cacheManager.get(exchangeKey);
        } catch (e) {
            console.log(e);
        }

        if (!currencyExchangeRate) {
            const exchangeRates = await this.fetchExchangeRates();
            
            Object.values(Currency).forEach(async (currency) => {
                await this.cacheManager.set(`${keyPrefix}${currency}`, exchangeRates[currency].value, 60000);
            });

            currencyExchangeRate = exchangeRates[priceCurrency].value;
        }
        
        return currencyExchangeRate;
    }

    private async fetchExchangeRates(): Promise<any> {
        try {
            const response = await this.httpService.get(
                `https://api.currencyapi.com/v3/latest?base_currency=USD&currencies=${Object.values(Currency).join(',')}`, {
                headers: {
                    apikey: process.env.CURRENCYAPI_KEY,
                },
            }).toPromise();
            return response.data.data;
        } catch (e) {
            console.log(e);
            return {};
        }
        
    }


    async increaseViewCount(product: Product): Promise<any | null> {
        try {
            return this.productsRepository.update(product.id, { viewCount: product.viewCount + 1 });   
        } catch (e) {
            console.log(e);
            return null
        }
    }

    async getMostViewedProducts(limit: number, currency: Currency): Promise<Product[] | null> {
        try {
            const products = await this.productsRepository.find({
                where: {
                    isDeleted: false,
                    viewCount: MoreThan(0),
                },
                order: {
                    viewCount: 'DESC',
                },
                take: limit,
            });
    
            if (currency !== Currency.USD) {
                for (let productKey in products) {        
                    products[productKey] = await this.applyExchangeRate(currency, products[productKey]);
                }
            }
    
            return products;
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    async remove(id: number): Promise<boolean> {
        try {
            const product = await this.productsRepository.findOneBy({ id });

            if (product) {
                product.isDeleted = true;
                await this.productsRepository.save(product);
            }

            return true;
        } catch (e) {
            console.log(e);
            return false;
        }
    }
}