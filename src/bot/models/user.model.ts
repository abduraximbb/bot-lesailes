import { Column, DataType, Model, Table } from 'sequelize-typescript';

interface IUserCreationAttr {
  user_id: number;
  username: string;
  region: string;
  lang: string;
  last_step: string;
}

@Table({ tableName: 'users' })
export class User extends Model<User, IUserCreationAttr> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
  })
  user_id: number;

  @Column({
    type: DataType.STRING,
  })
  username: string;

  @Column({
    type: DataType.STRING,
  })
  region: string;

  @Column({
    type: DataType.STRING,
  })
  lang: string;

  @Column({
    type: DataType.STRING,
    defaultValue: false,
  })
  last_step: string;
}
