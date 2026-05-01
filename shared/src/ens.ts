import { ethers } from 'ethers';

/**
 * ENS Utility for Alpha402
 * 
 * Provides human-readable identity for agents and users.
 * Integrates with ENS (Ethereum Name Service) for resolution.
 */

// Mock mapping for demo if ENS resolver is unavailable on testnet
const MOCK_ENS_MAP: Record<string, string> = {
  'commander.alpha402.eth': '0x7e4198E452921E32c30eeEfc9d58e63810b835D6',
  'intel.alpha402.eth':     '0xDFA20Faa8A0094B5dC3065b3315F8F818971eB39',
  'risk.alpha402.eth':      '0x1234567890123456789012345678901234567890',
  'execution.alpha402.eth': '0x0987654321098765432109876543210987654321',
};

const REVERSE_MOCK_MAP: Record<string, string> = Object.entries(MOCK_ENS_MAP).reduce((acc, [name, addr]) => {
  acc[addr.toLowerCase()] = name;
  return acc;
}, {} as Record<string, string>);

export class ENSIdentity {
  private provider: ethers.JsonRpcProvider | null = null;

  constructor(rpcUrl?: string) {
    if (rpcUrl) {
      try {
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
      } catch {
        // Silently fail if RPC is invalid
      }
    }
  }

  /** Resolves a name to an address */
  async resolveName(name: string): Promise<string | null> {
    if (MOCK_ENS_MAP[name]) return MOCK_ENS_MAP[name];
    
    if (this.provider) {
      try {
        return await this.provider.resolveName(name);
      } catch {
        return null;
      }
    }
    return null;
  }

  /** Resolves an address to a name */
  async lookupAddress(address: string): Promise<string | null> {
    const addr = address.toLowerCase();
    if (REVERSE_MOCK_MAP[addr]) return REVERSE_MOCK_MAP[addr];

    if (this.provider) {
      try {
        return await this.provider.lookupAddress(address);
      } catch {
        return null;
      }
    }
    return null;
  }

  /** Get agent name by ID */
  getAgentName(agentId: string): string {
    const name = agentId.toLowerCase();
    return `${name}.alpha402.eth`;
  }
}
