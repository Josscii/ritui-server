import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "@sequelize/core";
import { sequelize } from "./sequelize";

class Daily extends Model<
  InferAttributes<Daily>,
  InferCreationAttributes<Daily>
> {
  declare id: CreationOptional<number>;
  declare text: string;
  declare image: CreationOptional<string | null>;
  declare userId: number;
  declare status: CreationOptional<number>;
  declare showUserInfo: CreationOptional<number>;

  // createdAt can be undefined during creation
  declare createdAt: CreationOptional<Date>;
  // updatedAt can be undefined during creation
  declare updatedAt: CreationOptional<Date>;
}

Daily.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    text: {
      type: DataTypes.STRING(800),
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.INTEGER, // 0 pending 1 approved 2 reject
      defaultValue: 0,
      allowNull: false,
    },
    showUserInfo: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize }
);

export default Daily;
