export class Completer<T> {
  public readonly promise: Promise<T | undefined>;
  public isCompleted = false;
  public complete!: (value?: (PromiseLike<T | undefined> | T)) => void;
  public completeError!: (reason?: unknown) => void;

  public constructor() {
      this.promise = new Promise<T | undefined>((resolve, reject) => {
          this.complete = (v) => { this.isCompleted = true; resolve(v); };
          this.completeError = reject;
      })
  }
}
