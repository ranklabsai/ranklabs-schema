import type { ImageObject, VideoObject } from 'schema-dts';
import type { ImageInput, VideoInput } from '../types';

/**
 * MAP IMAGE
 * Converts a simple URL/Alt pair into a rich ImageObject.
 */
export function mapImage(input: ImageInput): ImageObject {
  return {
    '@type': 'ImageObject',
    contentUrl: input.url,
    url: input.url, // Redundant but maximizes compatibility across crawlers
    
    // AEO CRITICAL: "caption" acts as the Alt Text for the Knowledge Graph
    caption: input.altText,
    
    // Strict typing for dimensions
    width: input.width ? {
      '@type': 'QuantitativeValue',
      value: input.width
    } : undefined,
    
    height: input.height ? {
      '@type': 'QuantitativeValue',
      value: input.height
    } : undefined,
  };
}

/**
 * MAP VIDEO
 * Critical for Video SEO and "How-To" rich results.
 */
export function mapVideo(input: VideoInput): VideoObject {
  return {
    '@type': 'VideoObject',
    name: input.title,
    description: input.description,
    
    // GOOGLE REQUIREMENTS
    uploadDate: input.uploadDate, // ISO 8601
    thumbnailUrl: input.thumbnailUrl, // Must be a publicly accessible URL
    
    contentUrl: input.url,      // The actual video file (mp4)
    embedUrl: input.embedUrl,   // The player URL (youtube.com/embed/...)
    
    duration: input.duration,   // ISO 8601 Duration (e.g. "PT1M33S")
  };
}