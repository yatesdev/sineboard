export default function flatten<T extends ITreeNode<T>>(obj: T | T[]): T[] {
  const array = Array.isArray(obj) ? obj : [obj];
  return array.reduce((acc, value) => {
    acc.push(value);
    if (value.children) {
      acc = acc.concat(flatten(value.children));
      // delete value.children;
    }
    return acc;
  }, [] as T[]);
}

interface ITreeNode<T> {
  parent?: T;
  children?: T[];
}
