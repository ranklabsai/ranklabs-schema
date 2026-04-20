import type { ImageObject, VideoObject } from 'schema-dts';
import type { ImageInput, VideoInput } from '../types';

/**
 * MAP IMAGE
 * Converts a simple URL/Alt pair into a rich ImageObject.
 * Alt text is emitted as `name` (Schema.org's primary label, matches HTML alt
 * semantics for knowledge-graph extraction). Use `caption` on the input only
 * for longer contextual descriptions distinct from alt text.
 */
export function mapImage(input: ImageInput): ImageObject {
  return {
    '@type': 'ImageObject',
    contentUrl: input.url,
    url: input.url, // Redundant but maximizes compatibility across crawlers

    // AEO CRITICAL: `name` is the semantic label used by LLMs and Google's
    // knowledge graph. It mirrors the HTML `alt` attribute's role.
    name: input.altText,
    caption: input.caption,
    creditText: input.creditText,

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