export const emotions = {
  none: { label: 'None', icon: '' },
  happy: { label: 'Happy', icon: '😊' },
  sad: { label: 'Sad', icon: '😢' },
  angry: { label: 'Angry', icon: '😠' },
  surprised: { label: 'Surprised', icon: '😮' },
} as const;
export type Emotion = keyof typeof emotions;
export interface ExpressionState { emotion: Emotion; speech: string }
export const speechLimit = 160;

export class ExpressionManager {
  private emotion: Emotion = 'none';
  private speech = '';
  setEmotion(emotion: Emotion): void {
    if (Object.hasOwn(emotions, emotion)) this.emotion = emotion;
  }
  setSpeech(text: string): void {
    this.speech = Array.from(text).slice(0, speechLimit).join('');
  }
  get snapshot(): Readonly<ExpressionState> { return { emotion: this.emotion, speech: this.speech }; }
}
