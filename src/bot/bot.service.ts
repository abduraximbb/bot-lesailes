import { Injectable } from '@nestjs/common';
import { CreateBotDto } from './dto/create-bot.dto';
import { UpdateBotDto } from './dto/update-bot.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Context, Markup } from 'telegraf';
import { User } from './models/user.model';
import { Message } from 'telegraf/typings/core/types/typegram';
import { Telegraf, session } from 'telegraf';
import axios from 'axios';

import {
  ADD_PRODUCTS,
  ADD_TO_CART,
  ADDED_TO_CART,
  ADDRESS_CONFIRM,
  ADDRESS_CONFIRM_BUTTONS,
  BACK_BUTTON,
  CART,
  CART_INFO,
  CASH,
  CHOOSE_FROM_MAIN_MENU,
  choose_region,
  CHOOSE_TYPE_SERVICE,
  CLEAR,
  COMPLETED_CART,
  CONTINUE,
  DELIVERY,
  DELIVERY_TEXT,
  DETERMINE_AMOUNT,
  EMPTY_CART,
  FOR_ADD_INFO,
  FOR_HOUSE_NUM,
  MAIN_MENU,
  NO_ORDERS,
  NO_PROMOTIONS,
  regions,
  SKIP,
  START_ORDER,
  TOTAL,
  TYPE_SERVICE,
} from 'src/language_date';
import { Cart } from './models/cart.model';
import { Addressess } from './models/addressess.model';
import { Orders } from './models/orders.model';
import { Categories } from './models/category.model';
import { Products } from './models/product.model';
import { cp } from 'fs';
import { AddProducts } from './models/add-products.model';

@Injectable()
export class BotService {
  private bot: Telegraf<Context>;

  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Cart) private readonly cartModel: typeof Cart,
    @InjectModel(Addressess) private readonly addressModel: typeof Addressess,
    @InjectModel(Orders) private readonly ordersModel: typeof Orders,
    @InjectModel(Categories)
    private readonly categoriesModel: typeof Categories,
    @InjectModel(Products) private readonly productsModel: typeof Products,
    @InjectModel(AddProducts)
    private readonly addProductsModel: typeof AddProducts,
  ) {}

  async onStart(ctx: Context) {
    const userId = ctx.from.id;
    const user = await this.userModel.findOne({
      where: { user_id: userId },
    });

    if ((user && user.last_step !== 'finish') || !user) {
      if (user) {
        this.userModel.destroy({ where: { user_id: userId } });
      }

      await this.userModel.create({
        user_id: userId,
        username: ctx.from.username,
        last_step: 'lang',
      });

      await ctx.reply(
        `Assalomu alaykum! Les Ailes yetkazib berish xizmatiga xush kelibsiz.\n\nЗдравствуйте! Добро пожаловать в службу доставки Les Ailes.\n\nHello! Welcome to Les Ailes delivery service.`,
        {
          parse_mode: 'HTML',
          ...Markup.keyboard([['🇷🇺Русский', "🇺🇿O'zbekcha", '🇺🇸English']])
            .oneTime()
            .resize(),
        },
      );
    } else {
      await this.userModel.destroy({ where: { user_id: userId } });
      await ctx.reply(
        `Assalomu alaykum! Les Ailes yetkazib berish xizmatiga xush kelibsiz.\n\nЗдравствуйте! Добро пожаловать в службу доставки Les Ailes.\n\nHello! Welcome to Les Ailes delivery service.`,
        {
          parse_mode: 'HTML',
          ...Markup.keyboard([['🇷🇺Русский', "🇺🇿O'zbekcha", '🇺🇸English']])
            .oneTime()
            .resize(),
        },
      );
    }
  }

  async onLanguage(ctx: Context) {
    const userId = ctx.from.id;
    const user = await this.userModel.findByPk(userId);

    if (!user) {
      this.onStart(ctx);
      return;
    }
    if (user && user.last_step == 'lang') {
      const message = ctx.message as Message.TextMessage; // Explicit cast
      const language = message.text; // Foydalanuvchi yuborgan matn

      if (language === "🇺🇿O'zbekcha") user.lang = 'uz';
      else if (language === '🇷🇺Русский') user.lang = 'ru';
      else user.lang = 'en';

      user.last_step = 'region';
      await user.save();

      function chunkArray<T>(array: T[], size: number): T[][] {
        return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
          array.slice(i * size, i * size + size),
        );
      }

      await ctx.reply(choose_region[user.lang], {
        parse_mode: 'HTML',
        ...Markup.keyboard(chunkArray(regions[user.lang], 2))
          .oneTime()
          .resize(),
      });
    }
  }

  async onRegionSelect(ctx: Context, region: string) {
    const userId = ctx.from.id;
    const user = await this.userModel.findByPk(userId);

    if (user && user.last_step == 'region') {
      await user.update(
        { region, last_step: 'finish' },
        { where: { user_id: userId } },
      );
    }

    // Tilni aniqlash
    const userLang = user.lang || 'uz'; // Default 'uz' agar lang bo'sh bo'lsa

    // Bosh menyu sarlavhasi
    const menuTitle = CHOOSE_FROM_MAIN_MENU[userLang];

    // Tugmalarni kerakli formatda chiqarish
    const keyboard = Markup.keyboard(
      [
        [MAIN_MENU[userLang][0][0]], // Birinchi qator - bitta tugma
        [MAIN_MENU[userLang][1][0]], // Ikkinchi qator - bitta tugma
        [MAIN_MENU[userLang][2][0], MAIN_MENU[userLang][3][0]], // Uchinchi qator - 2 ta tugma
        [MAIN_MENU[userLang][4][0], MAIN_MENU[userLang][5][0]],
      ], // To'rtinchi qator - bitta tugma
    )
      .oneTime()
      .resize();

    // Foydalanuvchiga menyuni yuborish
    await ctx.reply(menuTitle, {
      parse_mode: 'HTML',
      ...keyboard,
    });
  }

  async onOrder(ctx: Context) {
    // ✅ CustomContext ni ishlatish
    const userId = ctx.from.id;
    const user = await this.userModel.findByPk(userId);

    if (user) {
      await user.update({ last_step: 'order' });
      await this.cartModel.destroy({ where: { user_id: userId } });
      await ctx.reply(CHOOSE_TYPE_SERVICE[user.lang], {
        parse_mode: 'HTML',
        ...Markup.keyboard([
          TYPE_SERVICE[user.lang], // Xizmat turlari
          [BACK_BUTTON[user.lang]], // Ortga qaytish tugmasi alohida qator
        ])
          .oneTime()
          .resize(),
      });
    }
  }

  async onDelivery(ctx: Context) {
    const userId = ctx.from.id;
    const user = await this.userModel.findByPk(userId);

    if (!user) return;

    await user.update({ last_step: 'delivery' });

    await this.cartModel.create({ user_id: userId, service_type: 'delivery' });

    const userLang = user.lang || 'uz'; // Default tilni belgilash

    await ctx.reply(DELIVERY_TEXT[userLang], {
      parse_mode: 'HTML',
      ...Markup.keyboard([
        [Markup.button.locationRequest(DELIVERY[userLang][0])], // 📍 Eng yaqin filialni aniqlash - YUQORIDA
        [BACK_BUTTON[userLang], DELIVERY[userLang][1]], // ⬅️ Ortga va 🗺 Mening manzillarim - QUYIDA YONMA-YON
      ])
        .oneTime()
        .resize(),
    });
  }

  async onLocation(ctx: Context) {
    if ('location' in ctx.message) {
      const { latitude, longitude } = ctx.message.location;
      const userId = ctx.from.id;
      const user = await this.userModel.findByPk(userId);

      if (user) {
        await user.update({ last_step: 'location' });

        try {
          // Reverse geocoding orqali manzilni olish
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse`,
            {
              params: {
                lat: latitude,
                lon: longitude,
                format: 'json',
                addressdetails: 1,
              },
            },
          );

          const addressData = response.data.address;

          // Qisqa manzilni shakllantirish
          const country = addressData.country || '';
          const city =
            addressData.city || addressData.town || addressData.village || '';
          const road = addressData.neighbourhood || addressData.locality;
          const houseNumber = addressData.house_number || '';

          await this.addressModel.create({
            user_id: userId,
            city,
            location: `${longitude},${latitude}`,
          });

          // Natijani jamlash
          const shortAddress =
            `${country}, ${city}, ${road},  ${houseNumber}`.trim();

          await ctx.reply(
            `${ADDRESS_CONFIRM[user.lang][0]} ${shortAddress}\n\n${ADDRESS_CONFIRM[user.lang][1]}`,
            {
              parse_mode: 'HTML',
              ...Markup.keyboard([
                [
                  BACK_BUTTON[user.lang],

                  ADDRESS_CONFIRM_BUTTONS[user.lang][0],
                  ,
                ],
                [
                  Markup.button.locationRequest(
                    ADDRESS_CONFIRM_BUTTONS[user.lang][1],
                  ),
                ],
              ])
                .oneTime()
                .resize(),
            },
          );
        } catch (error) {
          console.error('Manzil topilmadi:', error);
          await ctx.reply(
            'Kechirasiz, manzilni aniqlab bo‘lmadi. Qayta urinib ko‘ring.',
          );
        }
      }
    }
  }

  async onConfirm(ctx: Context) {
    const userId = ctx.from.id;
    const user = await this.userModel.findByPk(userId);
    if (user) {
      ctx.reply(FOR_HOUSE_NUM[user.lang], {
        reply_markup: { remove_keyboard: true },
      });
    }
  }

  async onText(ctx: Context) {
    if ('text' in ctx.message) {
      const userId = ctx.from.id;
      const user = await this.userModel.findByPk(userId);

      if (user) {
        if (user.last_step == 'location') {
          await user.update({ last_step: 'house_num' });
          const lastAddress = await this.addressModel.findOne({
            where: { user_id: userId },
            order: [['id', 'DESC']], // Eng oxirgi qo‘shilgan addressni topish
          });

          if (lastAddress) {
            await lastAddress.update({ house_num: ctx.message.text });
          }

          ctx.reply(FOR_ADD_INFO[user.lang]);
        } else if (user.last_step === 'house_num') {
          function chunkArray<T>(array: T[], size: number): T[][] {
            return Array.from(
              { length: Math.ceil(array.length / size) },
              (_, i) => array.slice(i * size, i * size + size),
            );
          }

          await user.update({ last_step: 'add_info' });
          const lastAddress = await this.addressModel.findOne({
            where: { user_id: userId },
            order: [['id', 'DESC']], // Eng oxirgi qo‘shilgan addressni topish
          });

          if (lastAddress) {
            await lastAddress.update({ add_info: ctx.message.text });
          }

          const categories = await this.categoriesModel.findAll();

          if (!categories || categories.length === 0) {
            return ctx.reply('Hali hech qanday kategoriya mavjud emas.');
          }

          const categoryNames = categories
            .map((category) => {
              return category.dataValues[user.lang];
            })
            .filter(Boolean);

          // Kategoriyalar bo‘sh bo‘lsa, xabar qaytarish
          if (!categoryNames.length) {
            return ctx.reply('Hali hech qanday kategoriya mavjud emas.');
          }

          // Klaviatura yaratish
          ctx.reply(START_ORDER[user.lang], {
            parse_mode: 'HTML',
            ...Markup.keyboard([
              [BACK_BUTTON[user.lang], CART[user.lang]],
              ...chunkArray(categoryNames, 2), // Kategoriyalarni 2 tadan joylash
            ]).resize(), // Klaviaturani ekranga moslash uchun
          });
        } else if (user.last_step.split('_')[0] == 'category') {
          await user.update({
            last_step: `product_${user.last_step.split('_')[1]}`,
          });

          try {
            const product = await this.productsModel.findOne({
              where: { [`name_${user.lang}`]: ctx.message.text },
            });

            if (!product) {
              return ctx.reply('Mahsulot topilmadi.');
            }

            const productName = product[`name_${user.lang}`];
            const productDesc = product[`desc_${user.lang}`];
            const productPrice = product.price.toLocaleString('uz-UZ');
            const productPhoto = product.photo;

            await ctx.reply(DETERMINE_AMOUNT[user.lang], {
              reply_markup: {
                keyboard: [
                  [
                    { text: BACK_BUTTON[user.lang] },
                    { text: ADD_TO_CART[user.lang] },
                  ],
                ],
                resize_keyboard: true,
                one_time_keyboard: false,
              },
            });

            await ctx.replyWithPhoto(productPhoto, {
              caption: `${productName}\n${productDesc}\nNarxi: ${productPrice} ${CASH[user.lang]}`,
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: '➖', callback_data: 'decrease' },
                    { text: '1', callback_data: 'quantity' },
                    { text: '➕', callback_data: 'increase' },
                  ],
                  [
                    {
                      text: ADD_TO_CART[user.lang],
                      callback_data: 'add_to_cart',
                    },
                  ],
                ],
              },
            });

            // Keyboard tugmalarini alohida jo‘natamiz
          } catch (error) {
            console.error('Mahsulotni yuklashda xatolik:', error);
            ctx.reply('Xatolik yuz berdi, keyinroq urinib ko‘ring.');
          }
        }
      }
    }
  }

  async onPromotions(ctx: Context) {
    const userId = ctx.from.id;
    const user = await this.userModel.findByPk(userId);

    const keyboard = Markup.keyboard(
      [
        [MAIN_MENU[user.lang][0][0]], // Birinchi qator - bitta tugma
        [MAIN_MENU[user.lang][1][0]], // Ikkinchi qator - bitta tugma
        [MAIN_MENU[user.lang][2][0], MAIN_MENU[user.lang][3][0]], // Uchinchi qator - 2 ta tugma
        [MAIN_MENU[user.lang][4][0], MAIN_MENU[user.lang][5][0]],
      ], // To'rtinchi qator - bitta tugma
    )
      .oneTime()
      .resize();

    // Foydalanuvchiga menyuni yuborish
    await ctx.reply(NO_PROMOTIONS[user.lang], {
      parse_mode: 'HTML',
      ...keyboard,
    });
  }

  async onHistoryOrders(ctx: Context) {
    const userId = ctx.from.id;
    const user = await this.userModel.findByPk(userId);

    if (user) {
      const orders = await this.ordersModel.findAll({
        where: { user_id: userId },
      });

      if (orders.length) {
        console.log(orders);
      } else {
        const keyboard = Markup.keyboard(
          [
            [MAIN_MENU[user.lang][0][0]], // Birinchi qator - bitta tugma
            [MAIN_MENU[user.lang][1][0]], // Ikkinchi qator - bitta tugma
            [MAIN_MENU[user.lang][2][0], MAIN_MENU[user.lang][3][0]], // Uchinchi qator - 2 ta tugma
            [MAIN_MENU[user.lang][4][0], MAIN_MENU[user.lang][5][0]],
          ], // To'rtinchi qator - bitta tugma
        )
          .oneTime()
          .resize();

        // Foydalanuvchiga menyuni yuborish
        await ctx.reply(NO_ORDERS[user.lang], {
          parse_mode: 'HTML',
          ...keyboard,
        });
      }
    }
  }

  async onCategorySelected(ctx: Context) {
    const data = ctx.message as Message.TextMessage;

    const userId = ctx.from.id;
    const user = await this.userModel.findByPk(userId);

    if (user) {
      let categoryName = '';
      if (user.last_step == 'add_info') {
        categoryName = data.text;
      } else {
        categoryName = user.last_step.split('_')[1];
      }
      await user.update({ last_step: `category_${categoryName}` });

      const category = await this.categoriesModel.findOne({
        where: { [user.lang]: categoryName },
        include: { all: true },
      });

      if (category) {
        function chunkArray<T>(array: T[], size: number): T[][] {
          return Array.from(
            { length: Math.ceil(array.length / size) },
            (_, i) => array.slice(i * size, i * size + size),
          );
        }
        const cart = await this.cartModel.findOne({
          where: { user_id: userId },
        });
        let textMessage = '';

        if (cart.products) {
          textMessage = CONTINUE[user.lang];
        } else {
          textMessage = START_ORDER[user.lang];
        }

        const productNames = category.products.map((el) => {
          return el[`name_${user.lang}`]; // To‘g‘ri ishlatilishi
        });

        ctx.reply(textMessage, {
          parse_mode: 'HTML',
          ...Markup.keyboard([
            [BACK_BUTTON[user.lang], CART[user.lang]],
            ...chunkArray(productNames, 2), // Kategoriyalarni 2 tadan joylash
          ]).resize(), // Klaviaturani ekranga moslash uchun
        });
      }
    }
  }

  async onIncDec(ctx: Context) {
    try {
      const action = ctx.callbackQuery['data'];
      console.log(action);

      const message = (ctx.callbackQuery.message as any).caption;

      const messageKeyboard = ctx.callbackQuery?.message as any;

      // Inline tugmadagi hozirgi sonni olish
      let currentQuantity = parseInt(
        messageKeyboard.reply_markup.inline_keyboard[0][1].text,
      );

      if (!message) {
        console.error('Xabar topilmadi yoki noto‘g‘ri format!');
        return;
      }

      const lines = message.split('\n');

      let total_price = Number(lines[2].split(' ')[1].replace(/\D/g, ''));

      const originPrice = total_price / currentQuantity;
      if (action === 'increase') {
        currentQuantity += 1;
      } else {
        currentQuantity -= 1;
      }

      function getCashKey(value: string): string | undefined {
        return Object.keys(CASH).find(
          (key) => CASH[key as keyof typeof CASH] === value,
        );
      }

      const language = getCashKey(lines[2].split(' ')[2]);

      const product = await this.productsModel.findOne({
        where: { [`name_${language}`]: lines[0] },
      });

      await ctx.editMessageCaption(
        `${product.dataValues[`name_${language}`]}\n${product.dataValues[`desc_${language}`]}\nNarxi: ${originPrice * currentQuantity} ${CASH[language]}`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '➖', callback_data: 'decrease' },
                { text: currentQuantity, callback_data: 'quantity' },
                { text: '➕', callback_data: 'increase' },
              ],
              [
                {
                  text: ADD_TO_CART[language],
                  callback_data: 'add_to_cart',
                },
              ],
            ],
          },
        },
      );
    } catch (error) {
      console.error('Xatolik:', error);
    }
  }

  async onAddToCart(ctx: Context) {
    const userId = ctx.from.id;
    const user = await this.userModel.findByPk(userId);
    if (ctx.callbackQuery) {
      const caption = (ctx.callbackQuery.message as any).caption;
      const productName = caption.split('\n')[0];
      const totalPrice = caption
        .split('\n')[2]
        .split(' ')[1]
        .replace(/\D/g, '');

      const messageKeyboard = ctx.callbackQuery?.message as any;

      // Inline tugmadagi hozirgi sonni olish
      const quantity = parseInt(
        messageKeyboard.reply_markup.inline_keyboard[0][1].text,
      );

      const product = await this.productsModel.findOne({
        where: { [`name_${user.lang}`]: productName },
      });

      const arr = [product.id, totalPrice / quantity, quantity];
      const cart = await this.cartModel.findOne({ where: { user_id: userId } });

      if (cart) {
        function chunkArray<T>(array: T[], size: number): T[][] {
          return Array.from(
            { length: Math.ceil(array.length / size) },
            (_, i) => array.slice(i * size, i * size + size),
          );
        }

        let updatedProducts = cart.products || [];
        updatedProducts.push(arr);

        const addProducts = await this.addProductsModel.findAll();

        const productNames = addProducts.map((el) => {
          return el[`name_${user.lang}`]; // To‘g‘ri ishlatilishi
        });

        await this.cartModel.update(
          { products: updatedProducts }, // Yangilangan `products`
          { where: { user_id: userId } },
        );
        await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
        await ctx.reply(
          `${ADDED_TO_CART[user.lang][0]} "${productName}" ${ADDED_TO_CART[user.lang][1]}`,
        );

        await ctx.reply(`${ADD_PRODUCTS[user.lang]}?`, {
          parse_mode: 'HTML',
          reply_markup: Markup.keyboard([
            ...chunkArray(productNames, 2), // Mahsulotlarni ikki ustunda joylashtiramiz
            [SKIP[user.lang]], // "SKIP" tugmachasini alohida qo‘shamiz
          ])
            .oneTime()
            .resize().reply_markup, // `.reply_markup` ni qo‘shish kerak!
        });
      } else {
        await ctx.reply('xatolik');
      }
    }
  }

  async onCart(ctx: Context) {
    const userId = ctx.from.id;
    const user = await this.userModel.findByPk(userId);
    const language = user.lang;

    const cart = await this.cartModel.findOne({ where: { user_id: userId } });
    if (!cart || !cart.dataValues.products?.length) {
      return ctx.reply(EMPTY_CART[language]);
    }

    const cartData = cart.dataValues.products; // [ [ '1', 25000, 2 ], [ '2', 27000, 3 ] ]
    let order_number = 1;
    let totalSum = 0;
    let cartText = `${CART[language]}\n\n`;
    let buttons: any[] = [];

    for (const item of cartData) {
      const [productId, price, quantity] = item;

      const product = await this.productsModel.findByPk(productId);
      if (!product) continue;

      const productName = product.dataValues.name_uz;
      const totalPrice = Number(price) * Number(quantity);

      totalSum += totalPrice;

      cartText += `*${order_number}. ${productName}*\n`;
      cartText += `${quantity} × ${price} = ${totalPrice} ${CASH[language]}\n\n`;

      // Inline buttonlar
      buttons.push([
        Markup.button.callback(
          `❌ ${order_number}. ${productName}`,
          `remove_${productId}`,
        ),
      ]);

      buttons.push([
        Markup.button.callback('➖', `decrease_${productId}`),
        Markup.button.callback(`${quantity}`, `noop`), // O‘zgarmaydi
        Markup.button.callback('➕', `increase_${productId}`),
      ]);

      order_number += 1;
    }

    cartText += `${TOTAL[language]}: ${totalSum} ${CASH[language]}`;

    // Xabarni yangilash yoki jo‘natish
    if (ctx.callbackQuery?.message?.message_id) {
      // Agar xabar allaqachon mavjud bo‘lsa, uni yangilaymiz
      return ctx.editMessageText(cartText, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons),
      });
    } else {
      // Agar xabar yo‘q bo‘lsa, yangisini yuboramiz
      ctx.reply(
        `${CART_INFO[user.lang][0]}\n\n${CART_INFO[user.lang][1]}\n\n${CART_INFO[user.lang][2]}`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            keyboard: [
              [BACK_BUTTON[user.lang], COMPLETED_CART[user.lang]],
              [CLEAR[user.lang]],
            ],
          },
        },
      );

      return ctx.reply(cartText, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons),
      });
    }
  }

  async onRemoveProduct(ctx: Context) {}

  async onIncreaseProduct(ctx: Context) {
    const userId = ctx.from.id;
    const user = await this.userModel.findByPk(userId);

    const action = ctx.callbackQuery['data'].split('_')[0];
    const productId = ctx.callbackQuery['data'].split('_')[1];

    if (action === 'increase') {
      const cart = await this.cartModel.findOne({ where: { user_id: userId } });

      if (cart) {
        // Mahsulotlarni to‘g‘ri formatga o‘tkazamiz
        let products = cart.dataValues.products.map(
          (item: (string | number)[]) => ({
            id: String(item[0]), // Birinchi element - id
            price: Number(item[1]),
            quantity: Number(item[2]),
          }),
        );

        // Tegishli mahsulotni topib, sonini oshiramiz
        products = products.map((item) => {
          if (item.id === productId) {
            return { ...item, quantity: item.quantity + 1 };
          }
          return item;
        });

        // Obyektni bazaga mos formatga qaytarib o‘zgartiramiz
        const updatedProducts = products.map((item) => [
          item.id,
          item.price,
          item.quantity,
        ]);

        // Yangilangan mahsulotlar ro‘yxatini bazaga saqlaymiz
        await this.cartModel.update(
          { products: updatedProducts }, // Bazaga qayta massiv sifatida yuboramiz
          { where: { user_id: userId } },
        );

        await this.onCart(ctx);
      } else {
        await ctx.answerCbQuery('Savat topilmadi ❌');
      }
    }
  }

  async onBack(ctx: Context) {
    const userId = ctx.from.id;
    const user = await this.userModel.findByPk(userId);

    if (user) {
      switch (user.last_step.split('_')[0]) {
        case 'order':
          await this.onRegionSelect(ctx, '');
          await user.update({ last_step: 'finish' });
          break;

        case 'delivery':
          await this.onOrder(ctx);
          break;

        case 'product':
          await this.onCategorySelected(ctx);
          break;

        default:
          await this.onRegionSelect(ctx, '');
          await user.update({ last_step: 'finish' });
      }
    }
  }
}

//ctx.sendPhoto(ctx.message.photo[3].file_id);
