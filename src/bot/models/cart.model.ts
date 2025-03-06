import { Column, DataType, Model, Table } from 'sequelize-typescript';

interface ICartCreationAttr {
  service_type: 'delivery' | 'takeaway'; // ENUM sifatida aniqlash
  user_id: number;
  products: (number | string)[][];
}

@Table({ tableName: 'cart' })
export class Cart extends Model<Cart, ICartCreationAttr> {
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
    type: DataType.ENUM('delivery', 'takeaway'), // ENUM sifatida belgilash
    allowNull: false,
  })
  service_type: 'delivery' | 'takeaway';

  @Column({
    type: DataType.JSONB,
  })
  products: (number | string)[][];
}
