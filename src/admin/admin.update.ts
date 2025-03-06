import { Command, Ctx, Start, Update } from 'nestjs-telegraf';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { Context } from 'telegraf';

@Update()
export class AdminUpdate {
  constructor(private readonly adminService: AdminService) {}
  
}
