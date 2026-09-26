import mongoose, { Schema } from 'mongoose';
import { IAdminCredentialDocument } from '../types/index.js';

const AdminCredentialSchema: Schema = new Schema<IAdminCredentialDocument>(
  {
    role: {
      type: String,
      required: true,
      unique: true,
      default: 'admin',
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

export const AdminCredential = mongoose.model<IAdminCredentialDocument>(
  'AdminCredential',
  AdminCredentialSchema
);
