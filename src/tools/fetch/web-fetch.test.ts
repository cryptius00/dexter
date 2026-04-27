import { describe, expect, it, mock } from 'bun:test';
import { isSafeAddress, isSafeHost } from './ssrf-guard.js';

describe('SSRF Guard', () => {
  describe('isSafeAddress', () => {
    it('blocks IPv4 loopback', () => {
      expect(isSafeAddress('127.0.0.1')).toBe(false);
      expect(isSafeAddress('127.255.255.255')).toBe(false);
    });

    it('blocks IPv4 private ranges', () => {
      expect(isSafeAddress('10.0.0.1')).toBe(false);
      expect(isSafeAddress('172.16.0.1')).toBe(false);
      expect(isSafeAddress('172.31.255.255')).toBe(false);
      expect(isSafeAddress('192.168.1.1')).toBe(false);
    });

    it('blocks IPv4 link-local', () => {
      expect(isSafeAddress('169.254.1.1')).toBe(false);
    });

    it('blocks IPv4 multicast and reserved', () => {
      expect(isSafeAddress('224.0.0.1')).toBe(false);
      expect(isSafeAddress('240.0.0.1')).toBe(false);
    });

    it('allows public IPv4 addresses', () => {
      expect(isSafeAddress('8.8.8.8')).toBe(true);
      expect(isSafeAddress('1.1.1.1')).toBe(true);
      expect(isSafeAddress('93.184.216.34')).toBe(true); // example.com
    });

    it('blocks IPv6 loopback and unspecified', () => {
      expect(isSafeAddress('::1')).toBe(false);
      expect(isSafeAddress('0:0:0:0:0:0:0:1')).toBe(false);
      expect(isSafeAddress('::')).toBe(false);
    });

    it('blocks IPv6 link-local and unique local', () => {
      expect(isSafeAddress('fe80::1')).toBe(false);
      expect(isSafeAddress('fc00::1')).toBe(false);
      expect(isSafeAddress('fdff::1')).toBe(false);
    });

    it('allows public IPv6 addresses', () => {
      expect(isSafeAddress('2001:4860:4860::8888')).toBe(true);
    });

    it('blocks IPv4-mapped IPv6 loopback', () => {
      expect(isSafeAddress('::ffff:127.0.0.1')).toBe(false);
    });

    it('blocks IPv4-mapped IPv6 private ranges', () => {
      expect(isSafeAddress('::ffff:10.0.0.1')).toBe(false);
      expect(isSafeAddress('::ffff:192.168.1.1')).toBe(false);
    });
  });

  describe('isSafeHost', () => {
    it('blocks known local hostnames', async () => {
      expect(await isSafeHost('localhost')).toBe(false);
      expect(await isSafeHost('foo.local')).toBe(false);
      expect(await isSafeHost('test.internal')).toBe(false);
    });

    it('resolves and checks hostnames', async () => {
      // Note: This actually performs DNS lookups, which might be flaky in some environments.
      // But example.com should always resolve to a public IP.
      expect(await isSafeHost('example.com')).toBe(true);
    });
  });
});
