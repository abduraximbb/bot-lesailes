import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Admin } from './models/admin.model';
import { AdminUpdate } from './admin.update';
import { OurAddressess } from 'src/bot/models/our-addressess.model';

@Module({
  imports: [SequelizeModule.forFeature([Admin,OurAddressess])],
  controllers: [],
  providers: [AdminService, AdminUpdate],
  exports: [AdminService,AdminUpdate],
})
export class AdminModule {}
