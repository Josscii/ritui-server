import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "@sequelize/core";
import { sequelize } from "./sequelize";

class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<number>;
  declare nickName: CreationOptional<string | null>;
  declare avatarUrl: CreationOptional<string | null>;
  declare city: CreationOptional<string | null>;
  declare country: CreationOptional<string | null>;
  declare gender: CreationOptional<string | null>;
  declare language: CreationOptional<string | null>;
  declare province: CreationOptional<string | null>;
  declare openid: CreationOptional<string | null>;
  declare unionid: CreationOptional<string | null>;
  declare ban: CreationOptional<number>;
  declare lastPostAt: CreationOptional<Date | null>;

  // createdAt can be undefined during creation
  declare createdAt: CreationOptional<Date>;
  // updatedAt can be undefined during creation
  declare updatedAt: CreationOptional<Date>;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nickName: {
      type: DataTypes.STRING,
    },
    avatarUrl: {
      type: DataTypes.STRING,
    },
    city: {
      type: DataTypes.STRING,
    },
    country: {
      type: DataTypes.STRING,
    },
    gender: {
      type: DataTypes.STRING,
    },
    language: {
      type: DataTypes.STRING,
    },
    province: {
      type: DataTypes.STRING,
    },
    openid: {
      type: DataTypes.STRING,
    },
    unionid: {
      type: DataTypes.STRING,
    },
    ban: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    lastPostAt: DataTypes.DATE,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
  }
);

export default User;
