/** LeviChan's UI text (the site's locales carry one of these each, under `levichan`). */
export interface LeviChanStrings {
  /** the avatar's tooltip / label */
  avatar: string;
  loading: string;
  loadFailed: string;
  menuTitle: string;
  hint: string;
  lookLabel: string;
  look: { auto: string; always: string; never: string };
  quiet: string;
  /** the camera keeps her in view */
  follow: string;
  /** fly the camera over to her */
  focus: string;
  exit: string;
  /** short speech bubbles */
  say: {
    hello: string;
    bye: string;
    welcomeBack: string;
    copied: string;
    dizzy: string;
    stop: string;
    pat: string;
    mined: string;
    yawn: string;
    look: string;
  };
}
