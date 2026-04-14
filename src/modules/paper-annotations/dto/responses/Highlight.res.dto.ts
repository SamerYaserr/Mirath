import { Highlight, HighlightColor } from '@prisma/client';

export class HighlightResDto {
  id: string;
  paperId: string;
  color: HighlightColor;
  note: string | null;

  xpathStart: string;
  xpathEnd: string;
  startOffset: number;
  endOffset: number;

  selectedText: string;
  plainText: string | null;
  htmlContent: string | null;

  contextBefore: string | null;
  contextAfter: string | null;
  firstWord: string | null;
  lastWord: string | null;
  selectedWordCount: number | null;
  selectedCharLength: number | null;

  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<HighlightResDto>) {
    Object.assign(this, partial);
  }

  static fromEntity(highlight: Highlight): HighlightResDto {
    return new HighlightResDto({
      id: highlight.id,
      paperId: highlight.paperId,
      color: highlight.color,
      note: highlight.note,
      xpathStart: highlight.xpathStart,
      xpathEnd: highlight.xpathEnd,
      startOffset: highlight.startOffset,
      endOffset: highlight.endOffset,
      selectedText: highlight.selectedText,
      plainText: highlight.plainText,
      htmlContent: highlight.htmlContent,
      contextBefore: highlight.contextBefore,
      contextAfter: highlight.contextAfter,
      firstWord: highlight.firstWord,
      lastWord: highlight.lastWord,
      selectedWordCount: highlight.selectedWordCount,
      selectedCharLength: highlight.selectedCharLength,
      createdAt: highlight.createdAt,
      updatedAt: highlight.updatedAt,
    });
  }
}
