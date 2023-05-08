/* eslint-disable mocha/max-top-level-suites */
/* eslint-disable mocha/no-setup-in-describe */
import assert from "assert";
import { Wallet } from "ethers";

import { ErrorTypes, Signature, SIWEthereum } from "../src/index";
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

  Object.entries(validationNegative).forEach(([test, value]) => {
    it(`Fails to verify message: ${test}`, async function () {
      try {
        const { payload } = value;
        const { signature } = value;
        const msg = new SIWEthereum({ payload });
        await msg.verify({ payload, signature });
      } catch (error) {
        assert.ok(Object.values(ErrorTypes).includes(error.message));
      }
    });
  });
});

describe(`Round Trip`, function () {
  const wallet = Wallet.createRandom();

  Object.entries(parsingPositive).forEach(([test, el]) => {
    it(`Generates a Successfully Verifying message: ${test}`, async function () {
      const { payload } = el.fields;
      payload.address = wallet.address;
      const msg = new SIWEthereum({ payload });
      const signature = new Signature();
      signature.s = await wallet.signMessage(msg.toMessage());
      signature.t = "eip191";
      const success = await msg.verify({ signature, payload });
      assert.ok(success);
    });
  });
});
