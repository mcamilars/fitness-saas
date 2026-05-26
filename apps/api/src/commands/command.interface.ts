export interface Command<T = unknown> {
  execute(): Promise<T>;
  undo(): Promise<void>;
  descripcion(): string;
}
