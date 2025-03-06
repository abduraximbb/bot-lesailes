import { Column, DataType, Model, Table } from 'sequelize-typescript';

interface IAddressessCreationAttr {
  city: string;
  house_num: string;
  add_info: string;
  location: string;
  user_id: number;
}

@Table({ tableName: 'addressess' })
export class Addressess extends Model<Addressess, IAddressessCreationAttr> {
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
    type: DataType.STRING,
  })
  city: string;

  @Column({
    type: DataType.STRING,
  })
  house_num: string;

  @Column({
    type: DataType.STRING,
  })
  add_info: string;

  @Column({
    type: DataType.STRING,
  })
  location: string;
}
