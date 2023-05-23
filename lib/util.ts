export const isObject = (value: any): boolean => Object.prototype.toString.call(value) === "[object Object]"
export const isFunction = (value: any): value is Function => typeof value === 'function';
export const isString = (value: any): value is String => typeof value === 'string';

export function genUUID(): string {
    let d = new Date().getTime();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }
  