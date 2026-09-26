import mongoose, { Schema } from 'mongoose';
import { IAdminPasswordResetDocument } from '../types/index.js';

const AdminPasswordResetSchema: Schema = new Schema<IAdminPasswordResetDocument>(
  {
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    used: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// TTL index to automatically purge old reset tokens from MongoDB after 7 days
AdminPasswordResetSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

export const AdminPasswordReset = mongoose.model<IAdminPasswordResetDocument>(
  'AdminPasswordReset',
  AdminPasswordResetSchema
);
