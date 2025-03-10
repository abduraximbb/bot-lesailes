import { Column, DataType, Model, Table } from 'sequelize-typescript';

interface IAdminCreationAttr {
  admin_id: number;
  last_step: string;
}

@Table({ tableName: 'admins' })
export class Admin extends Model<Admin, IAdminCreationAttr> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
  })
  admin_id: number;

  @Column({
    type: DataType.STRING,
    defaultValue: '',
  })
  last_step: string;
}
