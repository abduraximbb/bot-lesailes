import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { OurAddressess } from './our-addressess.model';

interface IOrderCreationAttr {
  user_id: number;
  products: any[][];
  total_price: number;
  addressId: number;
  service_type: 'delivery' | 'takeaway'; // ENUM sifatida aniqlash
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

  @ForeignKey(() => OurAddressess)
  @Column({
    type: DataType.INTEGER,
  })
  addressId: number;
  @BelongsTo(() => OurAddressess)
  address: OurAddressess;

  @Column({
    type: DataType.ENUM('delivery', 'takeaway'), // ENUM sifatida belgilash
  })
  service_type: 'delivery' | 'takeaway';
}
