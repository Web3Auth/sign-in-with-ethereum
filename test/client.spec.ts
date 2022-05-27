/* eslint-disable mocha/max-top-level-suites */
/* eslint-disable mocha/no-setup-in-describe */
import assert from "assert";
import { Wallet } from "ethers";

import { Signature, SIWEthereum } from "../src/index";
import parsingPositive from "./parsing_positive.json";
import validationNegative from "./validation_negative.json";
import validationPositive from "./validation_positive.json";

describe(`Message Generation from payload`, function () {
  Object.entries(parsingPositive).forEach(([test, value]) => {
    it(`Generates message successfully: ${test}`, function () {
      const { payload } = value.fields;
      const msg = new SIWEthereum({ payload });
      assert.equal(msg.toMessage(), value.message);
    });
  });
});

describe(`Message Generation from message`, function () {
  Object.entries(parsingPositive).forEach(([test, value]) => {
    it(`Generates message successfully: ${test}`, function () {
      const msg = new SIWEthereum(value.message);
      assert.equal(msg.toMessage(), value.message);
    });
  });
});

describe(`Message Validation`, function () {
  Object.entries(validationPositive).forEach(([test, value]) => {
    it(`Validates message successfully: ${test}`, async function () {
      const { payload } = value;
      const { signature } = value;
      const msg = new SIWEthereum({ payload });
      await assert.doesNotReject(msg.verify({ payload, signature }));
    });
  });

  test.concurrent.each(Object.entries(validationNegative))("Fails to verify message: %s", async (_n, testFields) => {
    try {
      const { payload } = testFields;
      const { signature } = testFields;
      const msg = new SIWEthereum({ payload });
      await msg.verify({ payload, signature });
    } catch (error) {
      expect(Object.values(SIWEthereum).includes(error));
    }
  });
});

describe(`Round Trip`, function () {
  const wallet = Wallet.createRandom();
  test.concurrent.each(Object.entries(parsingPositive))("Generates a Successfully Verifying message: %s", async (_, el) => {
    const { payload } = el.fields;
    payload.address = wallet.address;
    const msg = new SIWEthereum({ payload });
    const signature = new Signature();
    signature.s = await wallet.signMessage(msg.toMessage());
    signature.t = "eip191";
    await expect(msg.verify({ signature, payload }).then(({ success }) => success)).resolves.toBeTruthy();
  });
});
