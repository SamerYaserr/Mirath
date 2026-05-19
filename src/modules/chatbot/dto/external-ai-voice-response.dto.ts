export type ExternalAiVoiceEvent =
  | { type: 'transcription'; transcription: string }
  | { type: 'chat_title'; content?: string }
  | { type: 'status'; content?: string }
  | { type: 'model_answer'; content?: string }
  | { type: 'end'; content?: string }
  | { type: 'error'; content?: string };
