import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Categories } from './category.model';

interface IProductsCreationAttr {
  price: number;
  categoryId: number;
  photo: string;
  name_uz: string;
  name_ru: string;
  name_en: string;
  desc_uz: string;
  desc_ru: string;
  desc_en: string;
}

@Table({ tableName: 'products' })
export class Products extends Model<Products, IProductsCreationAttr> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column({
    type: DataType.STRING,
  })
  name_uz: string;

  @Column({
    type: DataType.STRING,
  })
  name_ru: string;

  @Column({
    type: DataType.STRING,
  })
  name_en: string;

  @Column({
    type: DataType.STRING,
  })
  desc_uz: string;

  @Column({
    type: DataType.STRING,
  })
  desc_ru: string;

  @Column({
    type: DataType.STRING,
  })
  desc_en: string;

  @Column({
    type: DataType.INTEGER,
  })
  price: number;

  @Column({
    type: DataType.STRING,
  })
  photo: string;

  @ForeignKey(() => Categories)
  @Column({
    type: DataType.INTEGER,
  })
  categoryId: number;
  @BelongsTo(() => Categories)
  category: Categories;
}
