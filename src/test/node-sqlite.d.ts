declare module 'node:sqlite' {
  type BindValue = string | number | null;

  export class DatabaseSync {
    constructor(location: string);
    exec(sql: string): void;
    prepare(sql: string): {
      run: (...params: BindValue[]) => void;
      all: (...params: BindValue[]) => unknown[];
    };
  }
}
