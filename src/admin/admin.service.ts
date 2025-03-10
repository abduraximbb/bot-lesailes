import { Injectable } from '@nestjs/common';
import { Context, Markup, Telegraf, session } from 'telegraf';
import { InjectModel } from '@nestjs/sequelize';
import { Admin } from './models/admin.model';
import { Addressess } from 'src/bot/models/addressess.model';
import { OurAddressess } from 'src/bot/models/our-addressess.model';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import { Categories } from 'src/bot/models/category.model';
import { Products } from 'src/bot/models/product.model';
import { choose_region, regions } from 'src/language_date';
import { Orders } from 'src/bot/models/orders.model';

// ✅ Botni yaratamiz va session middleware qo‘shamiz
const bot = new Telegraf(process.env.BOT_TOKEN);
bot.use(session());

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin) private readonly adminModel: typeof Admin,
    @InjectModel(OurAddressess)
    private readonly adressModel: typeof OurAddressess,
    @InjectModel(Categories) private readonly categoryModel: typeof Categories,
    @InjectModel(Products) private readonly productsModel: typeof Products,
    @InjectModel(Orders) private readonly ordersModel: typeof Orders,
  ) {}

  async onAdmin(ctx: Context) {
    const adminId = ctx.from.id;
    const admin = await this.adminModel.findOne({
      where: { admin_id: adminId },
    });

    if (admin) {
      await ctx.reply('Xush kelibsiz', {
        parse_mode: 'HTML',
        ...Markup.keyboard([
          ["Kategoriya qo'shish", "Taom qo'shish", "Manzil qo'shish"],
          ['Hisobot'],
          ['Ortga'],
        ]).resize(),
      });
    } else {
      await ctx.reply('Siz administrator emassiz.');
    }
  }

  async onReport(ctx: Context) {
    const orders = await this.ordersModel.findAll();
    console.log(orders);

    if (orders.length === 0) {
      return ctx.reply('Hali hech qanday buyurtmalar mavjud emas.');
    }

    try {
      const reportsDir = path.join(__dirname, '..', 'tmp');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Orders List');

      worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Mahsulotlar', key: 'products', width: 100 },
        { header: 'Umumiy summa', key: 'total_price', width: 20 },
        { header: 'Buyurtma turi', key: 'service_type', width: 10 },
      ];

      // Sarlavhalarni stilizatsiya qilish
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
      orders.forEach((order) => {
        const row = worksheet.addRow({
          id: order.id,
          products: order.products,
          total_price: order.total_price,
          service_type: order.service_type,
        });

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

      const fileName = `order_report_${Date.now()}.xlsx`;
      const filePath = path.join(reportsDir, fileName);

      await workbook.xlsx.writeFile(filePath);

      await ctx.replyWithDocument({ source: filePath });

      // Faylni o‘chirish
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error('Hisobot yaratishda xatolik:', error);
      await ctx.reply('Hisobotni yaratishda xatolik yuz berdi.');
    }
  }

  async addCategory(ctx: Context) {
    const adminId = ctx.from.id;
    const admin = await this.adminModel.findOne({
      where: { admin_id: adminId },
    });

    if (admin) {
      if (admin.last_step === 'finish') {
        await admin.update({ last_step: 'add_category' });
        await ctx.reply("Kategoriyaning o'zbekcha nomini yozing", {
          reply_markup: { remove_keyboard: true },
        });
      } else if (admin.last_step.split('_')[1] === 'category') {
        if ('text' in ctx.message) {
          if (admin.last_step.split('_')[0] === 'add') {
            await admin.update({ last_step: 'uz_category' });
            await this.categoryModel.create({ uz: ctx.message.text });
            await ctx.reply('Напишите русское название категории');
          } else if (admin.last_step.split('_')[0] === 'uz') {
            await admin.update({ last_step: 'ru_category' });
            const category = await this.categoryModel.findOne({
              order: [['id', 'DESC']], // ID bo‘yicha kamayish tartibida saralash
            });
            await category.update({ ru: ctx.message.text });

            await ctx.reply('Write the English name of the category');
          } else if (admin.last_step.split('_')[0] === 'ru') {
            await admin.update({ last_step: 'finish' });
            const category = await this.categoryModel.findOne({
              order: [['id', 'DESC']], // ID bo‘yicha kamayish tartibida saralash
            });
            await category.update({ en: ctx.message.text });

            await ctx.reply("Yangi kategoriya qo'shildi", {
              parse_mode: 'HTML',
              ...Markup.keyboard([
                ["Kategoriya qo'shish", "Taom qo'shish", "Manzil qo'shish"],
                ['Hisobot'],
                ['Ortga'],
              ]).resize(),
            });
          }
        }
      }
    } else {
      await ctx.reply('Siz administrator emassiz.');
    }
  }

  async addProduct(ctx: Context) {
    const adminId = ctx.from.id;
    const admin = await this.adminModel.findOne({
      where: { admin_id: adminId },
    });

    if (admin) {
      if (admin.last_step === 'finish') {
        function chunkArray<T>(array: T[], size: number): T[][] {
          return Array.from(
            { length: Math.ceil(array.length / size) },
            (_, i) => array.slice(i * size, i * size + size),
          );
        }
        const categories = await this.categoryModel.findAll();
        const categoryNames = categories
          .map((category) => {
            return category.dataValues['uz'];
          })
          .filter(Boolean);
        await admin.update({ last_step: 'add_product' });
        await ctx.reply('Qaysi kategoriyaga tegishli', {
          parse_mode: 'HTML',
          ...Markup.keyboard([
            ...chunkArray(categoryNames, 2), // Kategoriyalarni 2 tadan joylash
          ]).resize(), // Klaviaturani ekranga moslash uchun
        });
      } else if (admin.last_step.split('_')[1] === 'product') {
        if ('text' in ctx.message) {
          if (admin.last_step.split('_')[0] === 'add') {
            const category = await this.categoryModel.findOne({
              where: { uz: ctx.message.text },
            });
            await this.productsModel.create({ categoryId: category.id });
            await admin.update({ last_step: 'nameuz_product' });
            await ctx.reply("Taomning o'zbekcha nomini yozing", {
              reply_markup: { remove_keyboard: true },
            });
          } else if (admin.last_step.split('_')[0] === 'nameuz') {
            const product = await this.productsModel.findOne({
              order: [['id', 'DESC']], // id bo‘yicha kamayish tartibida saralash
            });
            await product.update({ name_uz: ctx.message.text });
            await admin.update({ last_step: 'nameru_product' });
            await ctx.reply('Напишите русское название блюда');
          } else if (admin.last_step.split('_')[0] === 'nameru') {
            const product = await this.productsModel.findOne({
              order: [['id', 'DESC']], // id bo‘yicha kamayish tartibida saralash
            });
            await product.update({ name_ru: ctx.message.text });
            await admin.update({ last_step: 'nameen_product' });
            await ctx.reply('Write the English name of the dish');
          } else if (admin.last_step.split('_')[0] === 'nameen') {
            const product = await this.productsModel.findOne({
              order: [['id', 'DESC']], // id bo‘yicha kamayish tartibida saralash
            });
            await product.update({ name_en: ctx.message.text });
            await admin.update({ last_step: 'descuz_product' });
            await ctx.reply("Taomning o'zbekcha tavsifini yozing");
          } else if (admin.last_step.split('_')[0] === 'descuz') {
            const product = await this.productsModel.findOne({
              order: [['id', 'DESC']], // id bo‘yicha kamayish tartibida saralash
            });
            await product.update({ desc_uz: ctx.message.text });
            await admin.update({ last_step: 'descru_product' });
            await ctx.reply('Напишите русское описание блюда');
          } else if (admin.last_step.split('_')[0] === 'descru') {
            const product = await this.productsModel.findOne({
              order: [['id', 'DESC']], // id bo‘yicha kamayish tartibida saralash
            });
            await product.update({ desc_ru: ctx.message.text });
            await admin.update({ last_step: 'descen_product' });
            await ctx.reply('Write an English description of the dish');
          } else if (admin.last_step.split('_')[0] === 'descen') {
            const product = await this.productsModel.findOne({
              order: [['id', 'DESC']], // id bo‘yicha kamayish tartibida saralash
            });
            await product.update({ desc_en: ctx.message.text });
            await admin.update({ last_step: 'price_product' });
            await ctx.reply('Mahsulot narxini yozing');
          } else if (admin.last_step.split('_')[0] === 'price') {
            const product = await this.productsModel.findOne({
              order: [['id', 'DESC']], // id bo‘yicha kamayish tartibida saralash
            });
            if (+ctx.message.text) {
              await product.update({ price: +ctx.message.text });
            } else {
              await ctx.reply('Xato narx kiritdingiz');
              return;
            }
            await admin.update({ last_step: 'photo_product' });
            await ctx.reply("Mahsulot rasmini jo'nating");
          }
        } else if ('photo' in ctx.message) {
          const product = await this.productsModel.findOne({
            order: [['id', 'DESC']], // id bo‘yicha kamayish tartibida saralash
          });
          await product.update({ photo: ctx.message.photo[1]['file_id'] });
          await admin.update({ last_step: 'finish' });
          await ctx.reply("Mahsulot muvaffaqiyatli qo'shildi", {
            parse_mode: 'HTML',
            ...Markup.keyboard([
              ["Kategoriya qo'shish", "Taom qo'shish", "Manzil qo'shish"],
              ['Hisobot'],
              ['Ortga'],
            ]).resize(),
          });
        }
      }
    }
  }

  async addAddress(ctx: Context) {
    const adminId = ctx.from.id;
    const admin = await this.adminModel.findOne({
      where: { admin_id: adminId },
    });

    if (admin) {
      if (admin.last_step === 'finish') {
        function chunkArray<T>(array: T[], size: number): T[][] {
          return Array.from(
            { length: Math.ceil(array.length / size) },
            (_, i) => array.slice(i * size, i * size + size),
          );
        }

        await admin.update({ last_step: 'add_address' });

        await ctx.reply('Qaysi shaharda', {
          parse_mode: 'HTML',
          ...Markup.keyboard(chunkArray(regions['uz'], 2)).resize(),
        });
      } else if (admin.last_step.split('_')[1] === 'address') {
        if (admin.last_step.split('_')[0] === 'add') {
          if ('text' in ctx.message) {
            await this.adressModel.create({ city: ctx.message.text });
            await admin.update({ last_step: 'location_address' });
            await ctx.reply("Lokatsiyani jo'nating", {
              parse_mode: 'HTML',
              ...Markup.keyboard([
                [Markup.button.locationRequest("Lokatsiya jo'natish")],
              ]).resize(),
            });
          }
        } else if (admin.last_step.split('_')[0] === 'location') {
          if ('location' in ctx.message) {
            const address = await this.adressModel.findOne({
              order: [['id', 'DESC']], // id bo‘yicha kamayish tartibida saralash
            });

            await address.update({
              location: `${ctx.message.location.longitude},${ctx.message.location.latitude}`,
            });

            await admin.update({ last_step: 'landmark_address' });

            await ctx.reply('Orienterni kiriting', {
              reply_markup: { remove_keyboard: true },
            });
          }
        } else if (admin.last_step.split('_')[0] === 'landmark') {
          if ('text' in ctx.message) {
            const address = await this.adressModel.findOne({
              order: [['id', 'DESC']], // id bo‘yicha kamayish tartibida saralash
            });
            await address.update({
              landmark: ctx.message.text,
            });

            await admin.update({ last_step: 'worktime_address' });
            await ctx.reply('Ish vaqtini kiriting misol:(08:00-20:00)');
          }
        } else if (admin.last_step.split('_')[0] === 'worktime') {
          if ('text' in ctx.message) {
            const address = await this.adressModel.findOne({
              order: [['id', 'DESC']], // id bo‘yicha kamayish tartibida saralash
            });

            await address.update({
              work_time: ctx.message.text.replace(/\s+/g, ''),
            });

            await admin.update({ last_step: 'finish' });
            await ctx.reply("Yangi lokatsiya muvaffaqiyatli qo'shildi", {
              parse_mode: 'HTML',
              ...Markup.keyboard([
                ["Kategoriya qo'shish", "Taom qo'shish", "Manzil qo'shish"],
                ['Hisobot'],
                ['Ortga'],
              ]).resize(),
            });
          }
        }
      }
    }
  }
}
