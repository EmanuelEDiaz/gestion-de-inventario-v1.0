import { describe, it, expect } from 'vitest';
import type { CustomerImage, CreateCustomerImageData, SetPrimaryCustomerImageData } from './customer-image';

describe('CustomerImage Entity', () => {
  const mockImage: CustomerImage = {
    id: 'img-1',
    customerId: 'cust-1',
    sortOrder: 0,
    isPrimary: true,
    contentType: 'image/jpeg',
    filePath: '/uploads/customers/cust-1/photo.jpg',
    originalFilename: 'photo.jpg',
    sizeBytes: 204800,
    createdAt: '2026-01-01T00:00:00Z',
  };

  it('should create a valid CustomerImage', () => {
    // Assert
    expect(mockImage.id).toBe('img-1');
    expect(mockImage.customerId).toBe('cust-1');
    expect(mockImage.isPrimary).toBe(true);
    expect(mockImage.sortOrder).toBe(0);
  });

  it('should allow null originalFilename', () => {
    // Arrange
    const imageWithoutFilename: CustomerImage = { ...mockImage, originalFilename: null };

    // Assert
    expect(imageWithoutFilename.originalFilename).toBeNull();
  });

  it('should accept valid content types', () => {
    // Arrange
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];

    // Assert
    expect(validTypes).toContain(mockImage.contentType);
  });

  it('should accept non-primary image with sortOrder > 0', () => {
    // Arrange
    const secondaryImage: CustomerImage = {
      ...mockImage,
      id: 'img-2',
      isPrimary: false,
      sortOrder: 1,
    };

    // Assert
    expect(secondaryImage.isPrimary).toBe(false);
    expect(secondaryImage.sortOrder).toBe(1);
  });
});

describe('CreateCustomerImageData', () => {
  it('should accept valid upload data', () => {
    // Arrange
    const createData: CreateCustomerImageData = {
      isPrimary: false,
      contentType: 'image/png',
      filePath: '/uploads/customers/cust-1/logo.png',
      originalFilename: 'logo.png',
      sizeBytes: 102400,
      sortOrder: 1,
    };

    // Assert
    expect(createData.sortOrder).toBe(1);
    expect(createData.isPrimary).toBe(false);
  });

  it('should allow omitting optional originalFilename', () => {
    // Arrange
    const createDataMin: CreateCustomerImageData = {
      isPrimary: true,
      contentType: 'image/webp',
      filePath: '/uploads/customers/cust-1/img.webp',
      sizeBytes: 51200,
      sortOrder: 0,
    };

    // Assert
    expect(createDataMin.originalFilename).toBeUndefined();
  });
});

describe('SetPrimaryCustomerImageData', () => {
  it('should contain imageId and customerId', () => {
    // Arrange
    const data: SetPrimaryCustomerImageData = { imageId: 'img-1', customerId: 'cust-1' };

    // Assert
    expect(data.imageId).toBe('img-1');
    expect(data.customerId).toBe('cust-1');
  });
});
