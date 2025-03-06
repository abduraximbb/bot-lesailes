import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

interface IAddProductsCreationAttr {
  price: number;
  name_uz: string;
  name_ru: string;
  name_en: string;
}

@Table({ tableName: 'add_products' })
export class AddProducts extends Model<AddProducts, IAddProductsCreationAttr> {
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
    type: DataType.INTEGER,
  })
  price: number;
}
