import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcrypt';

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, index: true })
  username: string;

  @Prop({ required: true })
  password_hash: string;

  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ type: [String], default: ['USER'] })
  roles: string[]; // 사용자 역할 (예: "USER", "OPERATOR", "ADMIN")

  @Prop({ type: Date, default: null })
  lastLoggedInAt?: Date;
}

export interface UserDocument extends User, Document {
  comparePassword(plainPassword: string): Promise<boolean>;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.methods.comparePassword = async function (
  this: UserDocument,
  plainPassword: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, this.password_hash);
};
