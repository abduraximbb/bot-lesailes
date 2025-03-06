import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { Products } from './product.model';

interface ICategoriesCreationAttr {
  name: string;
  uz:string
  ru:string
  en:string
}

@Table({ tableName: 'catrgories' })
export class Categories extends Model<Categories, ICategoriesCreationAttr> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column({
    type: DataType.STRING,
  })
  uz: string;

  @Column({
    type: DataType.STRING,
  })
  ru: string;

  @Column({
    type: DataType.STRING,
  })
  en: string;

  @HasMany(() => Products)
  products: Products[];
}
