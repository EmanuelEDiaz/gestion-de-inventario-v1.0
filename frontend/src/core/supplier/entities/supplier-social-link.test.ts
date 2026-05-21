import { describe, it, expect } from 'vitest';
import type { SupplierSocialLink, AddSupplierSocialLinkData, SocialPlatform } from './supplier-social-link';
import { SOCIAL_PLATFORM_LABELS } from './supplier-social-link';

describe('SupplierSocialLink Entity', () => {
  const mockLink: SupplierSocialLink = {
    id: 'link-1',
    supplierId: 'supp-1',
    platform: 'WHATSAPP',
    url: 'https://wa.me/5491155554444',
    label: 'Ventas',
    sortOrder: 0,
  };

  it('should create a valid SupplierSocialLink', () => {
    // Assert
    expect(mockLink.id).toBe('link-1');
    expect(mockLink.platform).toBe('WHATSAPP');
    expect(mockLink.url).toContain('wa.me');
  });

  it('should validate all SocialPlatform values', () => {
    // Arrange
    const validPlatforms: SocialPlatform[] = [
      'WHATSAPP', 'TELEGRAM', 'INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'WEBSITE', 'OTHER',
    ];

    // Assert
    expect(validPlatforms).toContain(mockLink.platform);
    expect(validPlatforms).toHaveLength(7);
  });

  it('should allow null label', () => {
    // Arrange
    const linkNoLabel: SupplierSocialLink = { ...mockLink, label: null };

    // Assert
    expect(linkNoLabel.label).toBeNull();
  });
});

describe('SOCIAL_PLATFORM_LABELS', () => {
  it('should have a label for every platform', () => {
    // Arrange
    const platforms: SocialPlatform[] = [
      'WHATSAPP', 'TELEGRAM', 'INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'WEBSITE', 'OTHER',
    ];

    // Assert
    platforms.forEach((platform) => {
      expect(SOCIAL_PLATFORM_LABELS[platform]).toBeTruthy();
    });
  });
});

describe('AddSupplierSocialLinkData', () => {
  it('should accept minimal required data', () => {
    // Arrange
    const minData: AddSupplierSocialLinkData = {
      platform: 'INSTAGRAM',
      url: 'https://instagram.com/proveedor',
    };

    // Assert
    expect(minData.platform).toBe('INSTAGRAM');
    expect(minData.label).toBeUndefined();
    expect(minData.sortOrder).toBeUndefined();
  });
});
