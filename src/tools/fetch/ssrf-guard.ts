import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

/**
 * Checks if an IP address is "safe" (not in a private, loopback, or link-local range).
 */
export function isSafeAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 0) return false;

  if (version === 4) {
    const parts = address.split('.').map(Number);
    if (parts.length !== 4) return false;

    // 0.0.0.0/8 (Current network)
    if (parts[0] === 0) return false;
    // 10.0.0.0/8 (Private)
    if (parts[0] === 10) return false;
    // 127.0.0.0/8 (Loopback)
    if (parts[0] === 127) return false;
    // 169.254.0.0/16 (Link-local)
    if (parts[0] === 169 && parts[1] === 254) return false;
    // 172.16.0.0/12 (Private)
    if (parts[0] === 172 && parts[1]! >= 16 && parts[1]! <= 31) return false;
    // 192.168.0.0/16 (Private)
    if (parts[0] === 192 && parts[1] === 168) return false;
    // 224.0.0.0/4 (Multicast)
    if (parts[0]! >= 224 && parts[0]! <= 239) return false;
    // 240.0.0.0/4 (Reserved)
    if (parts[0]! >= 240) return false;

    return true;
  }

  if (version === 6) {
    let lowerAddr = address.toLowerCase();

    // Check for IPv4-mapped IPv6 (::ffff:192.168.1.1)
    if (lowerAddr.startsWith('::ffff:')) {
      const ipv4Part = address.slice(7);
      if (isIP(ipv4Part) === 4) {
        return isSafeAddress(ipv4Part);
      }
    }

    // ::1/128 (Loopback)
    if (lowerAddr === '::1' || lowerAddr === '0:0:0:0:0:0:0:1') return false;
    // ::/128 (Unspecified)
    if (lowerAddr === '::' || lowerAddr === '0:0:0:0:0:0:0:0') return false;
    // fe80::/10 (Link-local)
    if (lowerAddr.startsWith('fe8') || lowerAddr.startsWith('fe9') || lowerAddr.startsWith('fea') || lowerAddr.startsWith('feb')) return false;
    // fc00::/7 (Unique local)
    if (lowerAddr.startsWith('fc') || lowerAddr.startsWith('fd')) return false;
    // ff00::/8 (Multicast)
    if (lowerAddr.startsWith('ff')) return false;

    return true;
  }

  return false;
}

/**
 * Resolves a hostname and checks if it's safe.
 */
export async function isSafeHost(host: string): Promise<boolean> {
  const lowerHost = host.toLowerCase();
  if (
    lowerHost === 'localhost' ||
    lowerHost.endsWith('.local') ||
    lowerHost.endsWith('.internal') ||
    lowerHost.endsWith('.test') ||
    lowerHost.endsWith('.invalid') ||
    lowerHost.endsWith('.localhost') ||
    lowerHost.endsWith('.example')
  ) {
    return false;
  }

  try {
    const { address } = await lookup(host);
    return isSafeAddress(address);
  } catch {
    // If resolution fails, we can't guarantee safety
    return false;
  }
}
