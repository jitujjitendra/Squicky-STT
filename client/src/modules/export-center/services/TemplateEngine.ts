/**
 * Template Engine
 *
 * Provides 6 templates as pure functions that transform a StandardTranscript
 * into an IntermediateDocument model. Templates control document structure
 * and content layout without knowing the final output format.
 *
 * Templates: standard, meeting, interview, podcast, business, youtube
 */

import type { StandardTranscript } from '@/modules/speech-engine/types';
import type {
  ExportOptions,
  ExportTemplate,
  IntermediateDocument,
  DocumentSection,
  TemplateName,
} from '../types';

/**
 * Format seconds to readable time string
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Build the base segments array from a transcript
 */
function buildSegments(transcript: StandardTranscript, options: ExportOptions) {
  return transcript.segments.map((seg, idx) => {
    const speaker = options.include_speakers && seg.speaker_id
      ? transcript.speakers.entries.find((s) => s.id === seg.speaker_id)?.display_name
        ?? transcript.speakers.entries.find((s) => s.id === seg.speaker_id)?.label
        ?? seg.speaker_id
      : undefined;

    return {
      index: idx,
      start: seg.start,
      end: seg.end,
      speaker,
      text: seg.text_display || seg.text,
      confidence: options.include_confidence ? seg.confidence : undefined,
    };
  });
}

/**
 * Build common metadata
 */
function buildMetadata(transcript: StandardTranscript): Record<string, string> {
  return {
    'Source File': transcript.source.filename,
    'Duration': formatTime(transcript.source.duration_seconds),
    'Language': transcript.transcription_meta.language,
    'Engine': transcript.transcription_meta.engine,
    'Speakers': String(transcript.speakers.count),
    'Created': transcript.transcription_meta.created_at,
  };
}

/**
 * Build content section from segments
 */
function buildContentSection(
  transcript: StandardTranscript,
  options: ExportOptions
): DocumentSection {
  const lines: string[] = [];

  for (const seg of transcript.segments) {
    const parts: string[] = [];

    if (options.include_timestamps) {
      parts.push(`[${formatTime(seg.start)}]`);
    }

    if (options.include_speakers && seg.speaker_id) {
      const speaker = transcript.speakers.entries.find((s) => s.id === seg.speaker_id);
      const name = speaker?.display_name ?? speaker?.label ?? seg.speaker_id;
      parts.push(`${name}:`);
    }

    parts.push(seg.text_display || seg.text);

    if (options.include_confidence) {
      parts.push(`(${(seg.confidence * 100).toFixed(0)}%)`);
    }

    lines.push(parts.join(' '));
  }

  return { type: 'content', title: 'Transcript', lines };
}

// --- Template implementations ---

/** Standard template - clean, general-purpose transcript output */
function standardTemplate(transcript: StandardTranscript, options: ExportOptions): IntermediateDocument {
  return {
    title: `Transcript: ${transcript.source.filename}`,
    metadata: buildMetadata(transcript),
    sections: [buildContentSection(transcript, options)],
    segments: buildSegments(transcript, options),
  };
}

/** Meeting template - includes speaker summary and action items section */
function meetingTemplate(transcript: StandardTranscript, options: ExportOptions): IntermediateDocument {
  const speakerSection: DocumentSection = {
    type: 'speakers',
    title: 'Participants',
    lines: transcript.speakers.entries.map((s) => {
      const time = transcript.speakers.speaking_time[s.id];
      const name = s.display_name ?? s.label;
      return time !== undefined
        ? `- ${name} (${formatTime(time)} speaking time)`
        : `- ${name}`;
    }),
  };

  return {
    title: `Meeting Notes: ${transcript.source.filename}`,
    metadata: {
      ...buildMetadata(transcript),
      'Type': 'Meeting',
    },
    sections: [
      speakerSection,
      { type: 'separator', lines: [] },
      buildContentSection(transcript, options),
      { type: 'separator', lines: [] },
      {
        type: 'footer',
        title: 'Action Items',
        lines: ['(No automated action items detected - review transcript for tasks)'],
      },
    ],
    segments: buildSegments(transcript, options),
  };
}

/** Interview template - Q&A format with speaker roles */
function interviewTemplate(transcript: StandardTranscript, options: ExportOptions): IntermediateDocument {
  const contentLines: string[] = [];
  let lastSpeaker = '';

  for (const seg of transcript.segments) {
    const speaker = seg.speaker_id
      ? transcript.speakers.entries.find((s) => s.id === seg.speaker_id)
      : undefined;
    const name = speaker?.display_name ?? speaker?.label ?? 'Unknown';

    if (name !== lastSpeaker) {
      if (contentLines.length > 0) contentLines.push('');
      contentLines.push(`**${name}:**`);
      lastSpeaker = name;
    }

    const parts: string[] = [];
    if (options.include_timestamps) {
      parts.push(`[${formatTime(seg.start)}]`);
    }
    parts.push(seg.text_display || seg.text);
    if (options.include_confidence) {
      parts.push(`(${(seg.confidence * 100).toFixed(0)}%)`);
    }
    contentLines.push(parts.join(' '));
  }

  return {
    title: `Interview: ${transcript.source.filename}`,
    metadata: {
      ...buildMetadata(transcript),
      'Type': 'Interview',
    },
    sections: [
      {
        type: 'content',
        title: 'Interview Transcript',
        lines: contentLines,
      },
    ],
    segments: buildSegments(transcript, options),
  };
}

/** Podcast template - episode-style with show notes section */
function podcastTemplate(transcript: StandardTranscript, options: ExportOptions): IntermediateDocument {
  return {
    title: `Episode Transcript: ${transcript.source.filename}`,
    metadata: {
      ...buildMetadata(transcript),
      'Type': 'Podcast',
      'Episode Duration': formatTime(transcript.source.duration_seconds),
    },
    sections: [
      {
        type: 'header',
        title: 'Show Notes',
        lines: [
          `Duration: ${formatTime(transcript.source.duration_seconds)}`,
          `Speakers: ${transcript.speakers.entries.map((s) => s.display_name ?? s.label).join(', ')}`,
        ],
      },
      { type: 'separator', lines: [] },
      buildContentSection(transcript, options),
    ],
    segments: buildSegments(transcript, options),
  };
}

/** Business template - formal structure with executive summary placeholder */
function businessTemplate(transcript: StandardTranscript, options: ExportOptions): IntermediateDocument {
  return {
    title: `Business Transcript: ${transcript.source.filename}`,
    metadata: {
      ...buildMetadata(transcript),
      'Type': 'Business',
      'Classification': 'Internal',
    },
    sections: [
      {
        type: 'header',
        title: 'Executive Summary',
        lines: [
          `This document contains the transcription of "${transcript.source.filename}".`,
          `Total duration: ${formatTime(transcript.source.duration_seconds)}.`,
          `Participants: ${transcript.speakers.count}.`,
        ],
      },
      { type: 'separator', lines: [] },
      {
        type: 'speakers',
        title: 'Participants',
        lines: transcript.speakers.entries.map((s) => `- ${s.display_name ?? s.label}`),
      },
      { type: 'separator', lines: [] },
      buildContentSection(transcript, options),
    ],
    segments: buildSegments(transcript, options),
  };
}

/** YouTube template - optimized for video descriptions and chapters */
function youtubeTemplate(transcript: StandardTranscript, options: ExportOptions): IntermediateDocument {
  // Build chapter markers from topic boundaries or every 5 minutes
  const chapterLines: string[] = [];
  let lastChapterTime = 0;
  const chapterInterval = 300; // 5 minutes

  for (const seg of transcript.segments) {
    if (seg.topic_boundary_hint || seg.start - lastChapterTime >= chapterInterval) {
      chapterLines.push(`${formatTime(seg.start)} - ${(seg.text_display || seg.text).slice(0, 60)}`);
      lastChapterTime = seg.start;
    }
  }

  // If no chapters detected, add at least the beginning
  if (chapterLines.length === 0) {
    chapterLines.push(`00:00 - Start`);
  }

  return {
    title: `${transcript.source.filename} - Transcript`,
    metadata: {
      ...buildMetadata(transcript),
      'Type': 'YouTube',
    },
    sections: [
      {
        type: 'header',
        title: 'Chapters',
        lines: chapterLines,
      },
      { type: 'separator', lines: [] },
      buildContentSection(transcript, options),
    ],
    segments: buildSegments(transcript, options),
  };
}

// --- Template registry ---

/** All available export templates */
export const templates: ExportTemplate[] = [
  {
    name: 'standard',
    label: 'Standard',
    description: 'Clean, general-purpose transcript output',
    apply: standardTemplate,
  },
  {
    name: 'meeting',
    label: 'Meeting Notes',
    description: 'Includes participant list and action items section',
    apply: meetingTemplate,
  },
  {
    name: 'interview',
    label: 'Interview',
    description: 'Q&A format with speaker roles',
    apply: interviewTemplate,
  },
  {
    name: 'podcast',
    label: 'Podcast',
    description: 'Episode-style with show notes',
    apply: podcastTemplate,
  },
  {
    name: 'business',
    label: 'Business',
    description: 'Formal structure with executive summary',
    apply: businessTemplate,
  },
  {
    name: 'youtube',
    label: 'YouTube',
    description: 'Optimized for video descriptions with chapters',
    apply: youtubeTemplate,
  },
];

/**
 * Get a template by name
 */
export function getTemplate(name: TemplateName): ExportTemplate | undefined {
  return templates.find((t) => t.name === name);
}

/**
 * Apply a template to a transcript
 */
export function applyTemplate(
  name: TemplateName,
  transcript: StandardTranscript,
  options: ExportOptions
): IntermediateDocument {
  const template = getTemplate(name);
  if (!template) {
    throw new Error(`Template "${name}" not found`);
  }
  return template.apply(transcript, options);
}
