import { ethers } from 'ethers';

/**
 * ENS Utility for Alpha402
 *
 * Provides human-readable identity for agents and users.
 * Integrates with ENS (Ethereum Name Service) for resolution.
 * Uses `staticNetwork` to prevent the ethers.js provider from spamming
 * "failed to detect network" retries on startup.
 */

// Sepolia network definition (chain ID 11155111)
const SEPOLIA = ethers.Network.from(11155111);

export class ENSIdentity {
  private provider: ethers.JsonRpcProvider | null = null;

  constructor(rpcUrl?: string) {
    if (rpcUrl) {
      try {
        // staticNetwork prevents the auto-detect retry loop that spams logs
        this.provider = new ethers.JsonRpcProvider(rpcUrl, SEPOLIA, {
          staticNetwork: SEPOLIA,
        });
      } catch {
        // Silently fail if RPC is invalid
      }
    }
  }

  /** Resolves an ENS name to an address */
  async resolveName(name: string): Promise<string | null> {
    if (this.provider) {
      try {
        return await this.provider.resolveName(name);
      } catch {
        return null;
      }
    }
    return null;
  }

  /** Resolves an address to an ENS name */
  async lookupAddress(address: string): Promise<string | null> {
    if (this.provider) {
      try {
        return await this.provider.lookupAddress(address);
      } catch {
        return null;
      }
    }
    return null;
  }

  /** 
   * Verifies that a given address owns the expected agent ENS name.
   * This turns ENS from a cosmetic label into a functional security layer.
   */
  async verifyAgent(agentId: string, address: string): Promise<boolean> {
    const expectedName = this.getAgentName(agentId);
    const resolvedAddress = await this.resolveName(expectedName);
    
    if (!resolvedAddress) return false;
    return resolvedAddress.toLowerCase() === address.toLowerCase();
  }

  /** Returns the canonical agent ENS name for a given agent ID */
  getAgentName(agentId: string): string {
    return `${agentId.toLowerCase()}.alpha402.eth`;
  }
}
