import { HighlightColor } from '@prisma/client';

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
}
