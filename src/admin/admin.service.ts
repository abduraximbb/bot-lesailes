import { Injectable } from '@nestjs/common';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { Context, Markup } from 'telegraf';
import { InjectModel } from '@nestjs/sequelize';
import { Admin } from './models/admin.model';
import { Addressess } from 'src/bot/models/addressess.model';
import { OurAddressess } from 'src/bot/models/our-addressess.model';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin) private readonly adminModel: typeof Admin,
    @InjectModel(OurAddressess)
    private readonly adressModel: typeof OurAddressess,
  ) {}
  async onAdmin(ctx: Context) {
    const adminId = ctx.from.id;
    const admin = this.adminModel.findOne({ where: { admin_id: adminId } });
    if (admin) {
      ctx.reply('Xush kelibsiz', {
        parse_mode: 'HTML',
        ...Markup.keyboard([
          ["Kategoriya qo'shish", "Taom qo'shish", "Manzil qo'shish"],
          ['Hisobot'],
          ['Ortga'],
        ]).resize(),
      });
    }
  }

  async onReport(ctx: Context) {
    const addressess = await this.adressModel.findAll();

    const reportsDir = path.join(__dirname, '..', 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    if (addressess.length === 0) {
      return ctx.reply('Hali hech qanday manzil mavjud emas.');
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Address List');

    // Sarlavhalarni qo‘shish
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Shahar', key: 'city', width: 20 },
      { header: 'Landmark', key: 'landmark', width: 30 },
    ];

    // **Sarlavhalarni qalin va markazga moslash**
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Ma'lumotlarni qo‘shish
    addressess.forEach((address, index) => {
      const row = worksheet.addRow({
        id: address.id,
        city: address.city,
        landmark: address.landmark,
      });

      // **Har bir katakka border va alignment qo‘yish**
      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    // Fayl nomini dinamik yaratish
    const fileName = `address_report_${Date.now()}.xlsx`;
    const filePath = path.join(__dirname, '..', 'tmp', fileName);

    // `tmp` papkasini yaratish (agar mavjud bo‘lmasa)
    if (!fs.existsSync(path.dirname(filePath))) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }

    // Excel faylini saqlash
    await workbook.xlsx.writeFile(filePath);

    // Faylni foydalanuvchiga yuborish
    await ctx.replyWithDocument({ source: filePath });

    // Faylni o‘chirish
    fs.unlinkSync(filePath);
  }
}
