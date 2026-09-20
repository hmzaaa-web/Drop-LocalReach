import mongoose, { Schema } from 'mongoose';
import { IFileDropDocument } from '../types/index.js';

const FileDropSchema: Schema = new Schema<IFileDropDocument>(
  {
    fileId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
      default: 'application/octet-stream',
    },
    size: {
      type: Number,
      required: true,
    },
    storageKey: {
      type: String,
      default: '',
    },
    passcodeHash: {
      type: String,
      default: '',
    },
    createdAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'expired', 'deleted'],
      default: 'pending',
      index: true,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// TTL index or compound indexes
FileDropSchema.index({ status: 1, expiresAt: 1 });
FileDropSchema.index({ status: 1, createdAt: 1 });

export const FileDrop = mongoose.model<IFileDropDocument>('FileDrop', FileDropSchema);
