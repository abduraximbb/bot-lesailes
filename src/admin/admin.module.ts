import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Admin } from './models/admin.model';
import { AdminUpdate } from './admin.update';
import { OurAddressess } from 'src/bot/models/our-addressess.model';
import { Categories } from 'src/bot/models/category.model';
import { Products } from 'src/bot/models/product.model';
import { Orders } from 'src/bot/models/orders.model';

@Module({
  imports: [SequelizeModule.forFeature([Admin,OurAddressess,Categories,Products,Orders])],
  controllers: [],
  providers: [AdminService, AdminUpdate],
  exports: [AdminService,AdminUpdate,SequelizeModule],
})
export class AdminModule {}
