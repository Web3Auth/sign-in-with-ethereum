// eslint-disable-next-line @typescript-eslint/no-explicit-any
const browserCrypto = globalThis.crypto || (globalThis as any).msCrypto || {};

export function randomBytes(size: number): Buffer {
  const arr = new Uint8Array(size);

  browserCrypto.getRandomValues(arr);

  return Buffer.from(arr);
}

export const createInfuraUrl = (url: string, projectId: string): string => {
  // split url by / and then replace last index with projectId and then join all the parts with /
  const parts = url.split("/");
  parts[parts.length - 1] = projectId;
  return parts.join("/");
};
