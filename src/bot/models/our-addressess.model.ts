import { Column, DataType, Model, Table } from 'sequelize-typescript';

interface IOurAddressessCreationAttr {
  city: string;
  landmark: string;
  location: string;
}

@Table({ tableName: 'ouraddressess' })
export class OurAddressess extends Model<
  OurAddressess,
  IOurAddressessCreationAttr
> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column({
    type: DataType.STRING,
  })
  city: string;

  @Column({
    type: DataType.STRING,
  })
  landmark: string;

  @Column({
    type: DataType.STRING,
  })
  location: string;
}
