/**
 * Image upload service for story/moment images.
 * Uploads to Supabase Storage and updates the DB record.
 */

import { supabase } from './supabase';

const BUCKET = 'story-images';
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export interface UploadResult {
  url: string;
  error?: never;
}

export interface UploadError {
  url?: never;
  error: string;
}

/**
 * Upload an image for a story.
 * 1. Validates file type/size
 * 2. Uploads to Supabase Storage (story-images bucket)
 * 3. Updates stories.image_url in Supabase DB
 * 4. Returns the public URL
 */
export async function uploadStoryImage(
  storyId: string,
  file: File,
): Promise<UploadResult | UploadError> {
  // Validate
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: `Invalid file type: ${file.type}. Use JPEG, PNG, WebP, or GIF.` };
  }
  if (file.size > MAX_SIZE) {
    return { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 5MB.` };
  }

  // Build filename: storyId.ext (overwrites previous image for this story)
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${storyId}.${ext}`;

  // Upload to Storage (upsert — overwrites if exists)
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` };
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const url = urlData.publicUrl;

  // Update DB record
  const { error: dbError } = await supabase
    .from('stories')
    .update({ image_url: url })
    .eq('id', storyId);

  if (dbError) {
    console.warn(`[image-upload] DB update failed for ${storyId}: ${dbError.message}`);
    // Image is uploaded but DB not updated — still return URL
    // The provider merge will pick it up from static data fallback
  }

  return { url };
}

/**
 * Upload a media image for a moment.
 * Uploads to Storage and inserts into moment_media table.
 */
export async function uploadMomentImage(
  momentId: string,
  file: File,
  caption?: string,
): Promise<UploadResult | UploadError> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: `Invalid file type: ${file.type}. Use JPEG, PNG, WebP, or GIF.` };
  }
  if (file.size > MAX_SIZE) {
    return { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 5MB.` };
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const timestamp = Date.now();
  const path = `moments/${momentId}-${timestamp}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: true });

  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` };
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const url = urlData.publicUrl;

  // Insert into moment_media table
  const { error: dbError } = await supabase
    .from('moment_media')
    .insert({
      moment_id: momentId,
      type: 'image',
      url,
      caption: caption || null,
      sort_order: 0, // prepend (lowest sort_order)
    });

  if (dbError) {
    console.warn(`[image-upload] moment_media insert failed: ${dbError.message}`);
  }

  return { url };
}
