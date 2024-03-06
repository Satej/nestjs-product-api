import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { Product } from './../src/products/product.entity';
import { DataSource } from 'typeorm';
import { Currency } from './../src/products/product.currency.model';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let appServer: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    appServer = app.getHttpServer()
  });

  afterEach(async () => {
    const dataSource = app.get(DataSource);
    await dataSource.createQueryBuilder().delete().from(Product).execute();
  });

  it('/ (GET) Base Route Check', () => {
    return request(appServer)
      .get('/')
      .expect(200)
      .expect('Welcome to Product API!');
  });

  it('Create Product request', async () => {
    await createProduct(appServer);
  });

  it('Get Product request', async () => {
    const product = {
      name: 'Example Product',
      price: 9.99,
      description: 'This is an example product',
    };

    // Create the product
    const createResponse = await request(appServer)
      .post('/products')
      .send(product)
      .expect(HttpStatus.CREATED);

    const createdProductId = createResponse.body.id;

    // Get the product
    const getResponse = await getProduct(appServer, createdProductId, product);
  });

  it('Get Product request in a different currency', async () => {
    const product = {
      name: 'Example Product',
      price: 9.99,
      description: 'This is an example product',
    };

    // Create the product
    const createResponse = await request(appServer)
      .post('/products')
      .send(product)
      .expect(HttpStatus.CREATED);

    const createdProductId = createResponse.body.id;

    // Get the product
    const getResponse = await getProduct(appServer, createdProductId, product, Currency.EUR);
  });

  it('/product/:id (DELETE)', async () => {
    const createdProductId = (await createProduct(appServer)).body.id;

    // Delete the product
    const deleteResponse = await request(appServer)
      .delete(`/products/${createdProductId}`)
      .expect(HttpStatus.NO_CONTENT);
  });

  it('/most-viewed (GET) when no products are present', async () => {
    return request(appServer)
      .get('/products/most-viewed')
      .expect(200)
      .expect([]);
  });

  it('/most-viewed (GET) when 10 products are present', async () => {
    // Create 10 products
    for (let i = 0; i < 10; i++) {
      const productId = (await createProduct(appServer)).body.id;
      await getProduct(appServer, productId);
    }

    return request(appServer)
      .get('/products/most-viewed')
      .expect(200)
      .expect((res) => res.body.length === 5);
  });

  it('/most-viewed (GET) when 10 products are present and limit shared is 10', async () => {
    // Create 10 products
    for (let i = 0; i < 10; i++) {
      const productId = (await createProduct(appServer)).body.id;
      await getProduct(appServer, productId);
    }

    return request(appServer)
      .get('/products/most-viewed?limit=10')
      .expect(200)
      .expect((res) => res.body.length === 10);
  });

  it('/most-viewed (GET) when 10 products are present and limit shared is 10 with a different currency', async () => {
    for (let i = 0; i < 10; i++) {
      const productId = (await createProduct(appServer)).body.id;
      await getProduct(appServer, productId);
    }

    return request(appServer)
      .get('/products/most-viewed?limit=10&currency=EUR')
      .expect(200)
      .expect((res) => {
        res.body.length === 10
        && res.body[0].currency === Currency.EUR
        && res.body[0].viewCount >= 0
      });
  });
});

async function getProduct(
    appServer: any,
    productId: any,
    product?: { name: string; price: number; description: string; },
    currency: Currency = Currency.USD) {
  if (product) {
    return request(appServer)
      .get(`/products/${productId}?currency=${currency}`)
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body.name).toEqual(product.name);
        expect(res.body.description).toEqual(product.description);
        expect(res.body.viewCount).toEqual(0);
        expect(res.body.currency).toEqual(currency);

        if (currency == Currency.USD) {
          expect(parseFloat(res.body.price)).toEqual(product.price);
        }
      });
  } else {
    return request(appServer)
      .get(`/products/${productId}`)
      .expect(HttpStatus.OK);
  }
}

async function createProduct(appServer: any) {
  const product = {
    name: 'Example Product',
    price: 9.99,
    description: 'This is an example product',
  };

  return request(appServer)
    .post('/products')
    .send(product)
    .expect(HttpStatus.CREATED)
    .expect((res) => {
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toEqual(product.name);
      expect(parseFloat(res.body.price)).toEqual(product.price);
      expect(res.body.description).toEqual(product.description);
      expect(res.body.currency).toEqual('USD');
    });
}