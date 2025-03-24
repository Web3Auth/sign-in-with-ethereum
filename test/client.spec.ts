import { Wallet } from "ethers";
import { describe, expect, it } from "vitest";

import { ErrorTypes, Signature, SIWEthereum } from "../src/index";
// import parsing1271 from "./parsing_1271.json";
import parsingPositive from "./parsing_positive.json";
import validationNegative from "./validation_negative.json";
import validationPositive from "./validation_positive.json";

describe(`Message Generation from payload`, () => {
  Object.entries(parsingPositive).forEach(([test, value]) => {
    it(`Generates message successfully: ${test}`, () => {
      const { payload } = value.fields;
      const msg = new SIWEthereum({ payload });
      expect(msg.toMessage()).toBe(value.message);
    });
  });
});

describe(`Message Generation from message`, () => {
  Object.entries(parsingPositive).forEach(([test, value]) => {
    it(`Generates message successfully: ${test}`, () => {
      const msg = new SIWEthereum(value.message);
      expect(msg.toMessage()).toBe(value.message);
    });
  });
});

describe(`Message Validation`, () => {
  Object.entries(validationPositive).forEach(([test, value]) => {
    it(`Validates message successfully: ${test}`, async () => {
      const { payload } = value;
      const { signature } = value;
      const msg = new SIWEthereum({ payload });
      await expect(msg.verify({ payload, signature })).resolves.toBeDefined();
    });
  });

  Object.entries(validationNegative).forEach(([test, value]) => {
    it(`Fails to verify message: ${test}`, async () => {
      try {
        const { payload } = value;
        const { signature } = value;
        const msg = new SIWEthereum({ payload });
        const error = await msg.verify({ payload, signature });
        expect(Object.values(ErrorTypes)).toContain(error.error.type);
      } catch (error: unknown) {
        expect(Object.values(ErrorTypes) as string[]).toContain((error as Error).message);
      }
    });
  });
});

describe(`Round Trip`, () => {
  const wallet = Wallet.createRandom();

  Object.entries(parsingPositive).forEach(([test, el]) => {
    it(`Generates a Successfully Verifying message: ${test}`, async () => {
      const { payload } = el.fields;
      payload.address = wallet.address;
      const msg = new SIWEthereum({ payload });
      const signature = new Signature();
      signature.s = await wallet.signMessage(msg.toMessage());
      signature.t = "eip191";
      const success = await msg.verify({ signature, payload });
      expect(success.success).toBe(true);
    });
  });
});

// eslint-disable-next-line vitest/no-commented-out-tests
// describe(`Round Trip 1271`, () => {
//   Object.entries(parsing1271).forEach(([testName, el]) => {
// eslint-disable-next-line vitest/no-commented-out-tests
//     test.skip(`Generates a Successfully Verifying message: ${testName}`, async () => {
//       const { payload, signature } = el.fields;
//       const msg = new SIWEthereum({ payload });
//       const success = await msg.verify({ signature, payload });
//       expect(success.success).toBe(true);
//     });
//   });
// });
