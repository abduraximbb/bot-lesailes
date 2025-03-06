import { Column, DataType, Model, Table } from 'sequelize-typescript';

interface IOrderCreationAttr {
  user_id: number;
  products: any[][];
  total_price: number;
}

@Table({ tableName: 'orders' })
export class Orders extends Model<Orders, IOrderCreationAttr> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column({
    type: DataType.BIGINT,
  })
  user_id: number;

  @Column({
    type: DataType.INTEGER,
  })
  total_price: number;

  @Column({
    type: DataType.JSON, // JSON sifatida saqlaymiz
    allowNull: false,
  })
  products: any[][];
}
