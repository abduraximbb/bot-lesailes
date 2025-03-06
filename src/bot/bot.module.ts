import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { BotUpdate } from './bot.update';
import { SequelizeModule } from '@nestjs/sequelize';
import { Addressess } from './models/addressess.model';
import { Cart } from './models/cart.model';
import { Categories } from './models/category.model';
import { Orders } from './models/orders.model';
import { OurAddressess } from './models/our-addressess.model';
import { Products } from './models/product.model';
import { User } from './models/user.model';
import { AdminModule } from 'src/admin/admin.module';
import { AdminService } from 'src/admin/admin.service';
import { Admin } from 'src/admin/models/admin.model';
import { AddProducts } from './models/add-products.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Addressess,
      Cart,
      Categories,
      Orders,
      OurAddressess,
      Products,
      User,
      Admin,AddProducts
    ]),
    AdminModule, // <== Bu joyda AdminModule mavjud
  ],
  controllers: [],
  providers: [BotService, BotUpdate,AdminService], // ❌ AdminUpdate olib tashlandi
})
export class BotModule {}
