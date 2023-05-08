const browserCrypto = global.crypto || global.msCrypto || {};

export function isValidUrl(url: string): boolean {
  try {
    // eslint-disable-next-line no-new
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

export function randomBytes(size: number): Buffer {
  const arr = new Uint8Array(size);
  if (typeof browserCrypto.getRandomValues === "undefined") {
    throw new Error("browserCrypto.getRandomValues is not defined");
  }
  browserCrypto.getRandomValues(arr);

  return Buffer.from(arr);
}
