import { randomUUID } from 'node:crypto';
import { getBucketName, getSupabaseClient } from '../lib/supabase';
import { UploadedCvFile } from '../types/registration';

export interface UploadedCvResult {
  id: string;
  storagePath: string;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
}

export async function uploadCvFile(file: UploadedCvFile): Promise<UploadedCvResult> {
  const id = randomUUID();
  const storagePath = `${id}/${sanitizeFileName(file.originalName)}`;

  const { error } = await getSupabaseClient()
    .storage.from(getBucketName())
    .upload(storagePath, file.buffer, {
      contentType: file.mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload CV file: ${error.message}`);
  }

  return { id, storagePath };
}

export async function deleteCvFile(storagePath: string): Promise<void> {
  await getSupabaseClient().storage.from(getBucketName()).remove([storagePath]);
}

export async function downloadCvFile(storagePath: string): Promise<Buffer | null> {
  const { data, error } = await getSupabaseClient()
    .storage.from(getBucketName())
    .download(storagePath);

  if (error) {
    const statusCode = (error as { statusCode?: string }).statusCode;
    if (statusCode === '404') {
      return null;
    }
    throw new Error(`Failed to download CV file: ${error.message}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
