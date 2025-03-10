import { regions } from 'src/language_date';
import { BotService } from './bot.service';
import { CreateBotDto } from './dto/create-bot.dto';
import { UpdateBotDto } from './dto/update-bot.dto';
import {
  Action,
  Command,
  Ctx,
  Hears,
  On,
  Start,
  Update,
} from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { Message } from 'telegraf/typings/core/types/typegram';
import { AdminService } from 'src/admin/admin.service';
import { InjectModel } from '@nestjs/sequelize';
import { Categories } from './models/category.model';
import { Admin } from 'src/admin/models/admin.model';

@Update()
export class BotUpdate {
  constructor(
    private readonly botService: BotService,
    private readonly adminService: AdminService,
    @InjectModel(Categories)
    private readonly categoriesModel: typeof Categories,
    @InjectModel(Admin) private readonly adminModel: typeof Admin,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: Context) {
    await this.botService.onStart(ctx);
  }

  @Hears(['🇷🇺Русский', "🇺🇿O'zbekcha", '🇺🇸English'])
  async onLanguage(@Ctx() ctx: Context) {
    await this.botService.onLanguage(ctx);
  }

  @Hears([...new Set(Object.values(regions).flat())])
  async onRegion(@Ctx() ctx: Context) {
    const admin = await this.adminModel.findByPk(ctx.from.id);
    if (admin && admin.last_step !== 'finish') {
      return this.adminService.addAddress(ctx);
    }
    function detectLanguage(region: string): string | null {
      return (
        Object.keys(regions).find((lang) => regions[lang].includes(region)) ||
        null
      );
    }

    const region =
      ctx.message && 'text' in ctx.message ? ctx.message.text : null;

    const lang = detectLanguage(region);

    if (lang) {
      await this.botService.onRegionSelect(ctx, region);
    } else {
      await ctx.reply("Noto'g'ri viloyat tanlandi. Qayta urinib ko'ring.");
    }
  }

  @Hears(['🛍 Buyurtma berish', '🛍 Оформить заказ', '🛍 Place an order'])
  async onOrder(@Ctx() ctx: Context) {
    await this.botService.onOrder(ctx);
  }

  @Hears(['⬅️ Ortga', '⬅️ Назад', '⬅️ Back'])
  async onBack(@Ctx() ctx: Context) {
    await this.botService.onBack(ctx);
  }

  @Hears(['🚙 Yetkazib berish', '🚙 Доставка', '🚙 Delivery'])
  async onDelivery(@Ctx() ctx: Context) {
    await this.botService.onDelivery(ctx);
  }

  @Hears(['✅ Tasdiqlash', '✅ Подтвердить', '✅ Confirm'])
  async onConfirm(@Ctx() ctx: Context) {
    await this.botService.onConfirm(ctx);
  }

  @On('location')
  async onLocation(@Ctx() ctx: Context) {
    const admin = await this.adminModel.findByPk(ctx.from.id);
    if (admin && admin.last_step !== 'finish') {
      return this.adminService.addAddress(ctx);
    }
    await this.botService.onLocation(ctx);
  }

  @Hears(['🔥 Aksiya', '🔥 Акции', '🔥 Promotions'])
  async onPromotions(@Ctx() ctx: Context) {
    await this.botService.onPromotions(ctx);
  }

  @Hears(['📖 Buyurtmalar tarixi', '📖 История заказов', '📖 Order history'])
  async onHistoryOrders(@Ctx() ctx: Context) {
    await this.botService.onHistoryOrders(ctx);
  }

  //----------------FOR ADMINS-----------------//
  @Command('admin')
  async onAdmin(@Ctx() ctx: Context) {
    await this.adminService.onAdmin(ctx);
  }

  @Hears(['Hisobot'])
  async onReport(@Ctx() ctx: Context) {
    await this.adminService.onReport(ctx);
  }

  @Hears('Ortga')
  async onBackAdmin(@Ctx() ctx: Context) {
    await this.botService.onStart(ctx);
  }

  @Hears("Kategoriya qo'shish")
  async onAddCategory(@Ctx() ctx: Context) {
    await this.adminService.addCategory(ctx);
  }

  @Hears("Taom qo'shish")
  async onAddProduct(@Ctx() ctx: Context) {
    await this.adminService.addProduct(ctx);
  }

  @Hears("Manzil qo'shish")
  async onAddAddress(@Ctx() ctx: Context) {
    await this.adminService.addAddress(ctx);
  }
  //--------------------------------------------//
  @Hears(['📥 Корзина', '📥 Savat', '📥 Cart'])
  async onCart(@Ctx() ctx: Context) {
    await this.botService.onCart(ctx);
  }

  @Hears([
    "📥 Savatga qo'shish ✅",
    '📥 Добавить в корзину ✅',
    '📥 Add to cart ✅',
  ])
  async onAddToCart(@Ctx() ctx: Context) {
    await this.botService.onAddToCart(ctx);
  }

  @Hears([
    '✅ Iloji boricha tezroq',
    '✅ Как можно скорее',
    '✅ As soon as possible',
  ])
  async onFaster(@Ctx() ctx: Context) {
    await this.botService.onFaster(ctx);
  }

  @Hears(new RegExp('^\\p{Extended_Pictographic}\\s?.+', 'u')) // Emoji + matn formatiga mos regex
  async onCategorySelected(ctx: Context) {
    const admin = await this.adminModel.findByPk(ctx.from.id);
    if (admin && admin.last_step.split('_')[1] === 'category') {
      return this.adminService.addCategory(ctx);
    } else if (admin && admin.last_step.split('_')[1] === 'product') {
      return this.adminService.addProduct(ctx);
    }
    if ('text' in ctx.message && typeof ctx.message.text === 'string') {
      const textMessage = ctx.message.text; // Matnni olish

      const categories = await this.categoriesModel.findAll();
      categories.map(async (category) => {
        if (
          [
            category.dataValues.uz,
            category.dataValues.ru,
            category.dataValues.en,
          ].includes(textMessage)
        ) {
          await this.botService.onCategorySelected(ctx);
        }
      });
    }
  }

  @Action('increase')
  async onIncrease(@Ctx() ctx: Context) {
    await this.botService.onIncDec(ctx);
  }

  @Action('decrease')
  async onDecrease(@Ctx() ctx: Context) {
    await this.botService.onIncDec(ctx);
  }

  @Action('add_to_cart')
  async onAddToCart2(@Ctx() ctx: Context) {
    await this.botService.onAddToCart(ctx);
  }

  @Hears(["O'tkazib yuborish", 'Пропустить', 'Skip'])
  async onSkip(@Ctx() ctx: Context) {
    await this.botService.onCategorySelected(ctx);
  }

  @Action(/^remove_\d+$/)
  async onRemoveProduct(@Ctx() ctx: Context) {
    await this.botService.onRemoveProduct(ctx);
  }

  @Action(/^increase_\d+$/)
  async onIncreaseProduct(@Ctx() ctx: Context) {
    await this.botService.onIncDecProduct(ctx);
  }

  @Action(/^decrease_\d+$/)
  async onDecreaseProduct(@Ctx() ctx: Context) {
    await this.botService.onIncDecProduct(ctx);
  }

  @Hears([
    "Savatni to'ldirdim✅",
    'Я заполнил корзину✅',
    'I have completed the cart✅',
  ])
  async onCompleteCart(@Ctx() ctx: Context) {
    await this.botService.onCompleteCart(ctx);
  }

  @On('photo')
  async photo(ctx: Context) {
    if ('photo' in ctx.message) {
      const admin = await this.adminModel.findByPk(ctx.from.id);
      if (admin && admin.last_step !== 'finish') {
        return this.adminService.addProduct(ctx);
      }
    }
  }

  @On('text')
  async onText(@Ctx() ctx: Context) {
    const admin = await this.adminModel.findByPk(ctx.from.id);
    if (admin && admin.last_step !== 'finish') {
      return this.adminService.addAddress(ctx);
    }
    await this.botService.onText(ctx);
  }
}
