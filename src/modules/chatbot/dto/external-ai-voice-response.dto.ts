export type ExternalAiVoiceEvent =
  | {
      type: 'transcription';
      transcription: string;
    }
  | {
      type: 'chunk';
      content: string | [{ type: 'text'; text: string }];
    }
  | {
      type: 'end';
    }
  | {
      type: 'error';
      message?: string;
    }
  | {
      type: 'metadata';
      chat_title?: string;
    };
