import { SUPPORTED_NETWORKS } from "@toruslabs/ethereum-controllers";
import { JsonRpcProvider, verifyMessage } from "ethers";

import { SIWEthereumBase } from "./base";
import { verifyMessage as eipVerifyMessage } from "./signatureValidator";
import { ErrorTypes, SignInWithEthereumError, SignInWithEthereumResponse, VerifyParams } from "./types";

export class SIWEthereum extends SIWEthereumBase {
  /**
   * Validates the integrity of the object by matching it's signature.
   * @param params - Parameters to verify the integrity of the message, signature is required.
   * @returns This object if valid.
   */
  async verify(params: VerifyParams): Promise<SignInWithEthereumResponse> {
    const { payload, signature } = params;

    /** Domain binding */
    if (payload.domain && payload.domain !== this.payload.domain) {
      return {
        success: false,
        data: this,
        error: new SignInWithEthereumError(ErrorTypes.DOMAIN_MISMATCH, payload.domain, this.payload.domain),
      };
    }

    /** Nonce binding */
    if (payload.nonce && payload.nonce !== this.payload.nonce) {
      return {
        success: false,
        data: this,
        error: new SignInWithEthereumError(ErrorTypes.NONCE_MISMATCH, payload.nonce, this.payload.nonce),
      };
    }

    /** Check time */
    const checkTime = new Date();

    /** Expiry Checks */
    if (this.payload.expirationTime) {
      const expirationDate = new Date(this.payload.expirationTime);

      // Check if the message hasn't expired
      if (checkTime.getTime() >= expirationDate.getTime()) {
        return {
          success: false,
          data: this,
          error: new SignInWithEthereumError(
            ErrorTypes.EXPIRED_MESSAGE,
            `${checkTime.toISOString()} < ${expirationDate.toISOString()}`,
            `${checkTime.toISOString()} >= ${expirationDate.toISOString()}`
          ),
        };
      }
    }

    /** Message is valid already */
    if (this.payload.notBefore) {
      const notBefore = new Date(this.payload.notBefore);
      if (checkTime.getTime() < notBefore.getTime()) {
        return {
          success: false,
          data: this,
          error: new SignInWithEthereumError(
            ErrorTypes.EXPIRED_MESSAGE,
            `${checkTime.toISOString()} >= ${notBefore.toISOString()}`,
            `${checkTime.toISOString()} < ${notBefore.toISOString()}`
          ),
        };
      }
    }

    const message = this.prepareMessage();

    /** Recover address from signature */
    try {
      const recoveredAddress = verifyMessage(message, signature.s);
      if (recoveredAddress.toLowerCase() === this.payload.address.toLowerCase()) {
        return {
          success: true,
          data: this,
        };
      }
      const { rpcTarget, displayName } = SUPPORTED_NETWORKS[`0x${this.payload.chainId.toString(16)}`];
      if (!rpcTarget) {
        throw new Error("Unsupported chainId");
      }
      const infuraKey = process.env.VITE_APP_INFURA_PROJECT_KEY;
      const finalRpcTarget = rpcTarget.replace("VITE_APP_INFURA_PROJECT_KEY", infuraKey);
      const provider = new JsonRpcProvider(finalRpcTarget, { chainId: this.payload.chainId, name: displayName });
      const isValid = await eipVerifyMessage({ signature: signature.s, message, signer: this.payload.address, provider });
      if (!isValid) {
        return {
          success: false,
          data: this,
          error: new SignInWithEthereumError(ErrorTypes.INVALID_SIGNATURE),
        };
      }
      return {
        success: true,
        data: this,
      };
    } catch (error: unknown) {
      return {
        success: false,
        data: this,
        error: new SignInWithEthereumError(ErrorTypes.INVALID_SIGNATURE),
      };
    }
  }
}
