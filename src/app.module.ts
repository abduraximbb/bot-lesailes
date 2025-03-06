import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TelegrafModule } from 'nestjs-telegraf';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { BotModule } from './bot/bot.module';
import { BOT_NAME } from './app.constants';
import { Addressess } from './bot/models/addressess.model';
import { Cart } from './bot/models/cart.model';
import { Categories } from './bot/models/category.model';
import { Orders } from './bot/models/orders.model';
import { OurAddressess } from './bot/models/our-addressess.model';
import { Products } from './bot/models/product.model';
import { User } from './bot/models/user.model';
import { AdminModule } from './admin/admin.module';
import { Admin } from './admin/models/admin.model';
import { session } from 'telegraf';
import { AddProducts } from './bot/models/add-products.model';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      botName: BOT_NAME,
      useFactory: () => ({
        token: process.env.BOT_TOKEN,
        include: [BotModule, AdminModule],
      }),
    }),
    ConfigModule.forRoot({ envFilePath: '.env', isGlobal: true }),
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      models: [
        Addressess,
        Cart,
        Categories,
        Orders,
        OurAddressess,
        Products,
        User,
        Admin,
        AddProducts,
      ],
      autoLoadModels: true,
      sync: { alter: true }, //force
      logging: false,
    }),
    BotModule,
    AdminModule,
    // BotModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
