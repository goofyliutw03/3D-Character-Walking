export class SpeechEditor {
  constructor(input: HTMLTextAreaElement, update: (text: string, announce: boolean) => void, signal: AbortSignal) {
    let composing = false;
    input.addEventListener('compositionstart', () => { composing = true; }, { signal });
    input.addEventListener('compositionend', () => {
      composing = false; update(input.value, true);
    }, { signal });
    input.addEventListener('input', event => {
      if (!composing && !event.isComposing) update(input.value, false);
    }, { signal });
    const commit = (): void => { if (!composing) update(input.value, true); };
    input.addEventListener('change', commit, { signal });
    input.addEventListener('blur', commit, { signal });
  }
}
