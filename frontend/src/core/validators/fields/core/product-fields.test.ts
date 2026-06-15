import { describe, it, expect } from 'vitest';
import { productName, productSku, productStandardCost, productSalePrice, productTaxRate, productReorderPoint, productBarcode, productDescription, unitOfMeasure, productStatus, costMethod } from './product-fields';

describe('productName', () => {
  it('accepts valid name', () => {
    expect(productName().safeParse('Product A').success).toBe(true);
  });

  it('rejects empty name', () => {
    expect(productName().safeParse('').success).toBe(false);
  });

  it('rejects name over 200 chars', () => {
    expect(productName().safeParse('x'.repeat(201)).success).toBe(false);
  });

  it('accepts name at exactly 200 chars', () => {
    expect(productName().safeParse('x'.repeat(200)).success).toBe(true);
  });
});

describe('productSku', () => {
  it('accepts valid SKU', () => {
    expect(productSku().safeParse('SKU-001').success).toBe(true);
  });

  it('accepts empty SKU', () => {
    expect(productSku().safeParse('').success).toBe(true);
  });

  it('rejects SKU over 50 chars', () => {
    expect(productSku().safeParse('x'.repeat(51)).success).toBe(false);
  });
});

describe('productBarcode', () => {
  it('accepts valid barcode', () => {
    expect(productBarcode().safeParse('123456789').success).toBe(true);
  });

  it('rejects barcode over 50 chars', () => {
    expect(productBarcode().safeParse('x'.repeat(51)).success).toBe(false);
  });
});

describe('productDescription', () => {
  it('accepts valid description', () => {
    expect(productDescription().safeParse('A product description').success).toBe(true);
  });

  it('rejects description over 2000 chars', () => {
    expect(productDescription().safeParse('x'.repeat(2001)).success).toBe(false);
  });
});

describe('productStandardCost', () => {
  it('coerces from string', () => {
    const r = productStandardCost().safeParse('10.50');
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe(10.50);
  });

  it('accepts zero', () => {
    expect(productStandardCost().safeParse(0).success).toBe(true);
  });

  it('rejects negative', () => {
    expect(productStandardCost().safeParse(-1).success).toBe(false);
  });
});

describe('productSalePrice', () => {
  it('coerces from string', () => {
    const r = productSalePrice().safeParse('25.99');
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe(25.99);
  });

  it('rejects negative', () => {
    expect(productSalePrice().safeParse(-5).success).toBe(false);
  });
});

describe('productTaxRate', () => {
  it('accepts value between 0 and 100', () => {
    expect(productTaxRate().safeParse(21).success).toBe(true);
  });

  it('rejects value over 100', () => {
    expect(productTaxRate().safeParse(101).success).toBe(false);
  });

  it('rejects negative', () => {
    expect(productTaxRate().safeParse(-1).success).toBe(false);
  });
});

describe('productReorderPoint', () => {
  it('accepts zero', () => {
    expect(productReorderPoint().safeParse(0).success).toBe(true);
  });

  it('rejects negative', () => {
    expect(productReorderPoint().safeParse(-1).success).toBe(false);
  });
});

describe('unitOfMeasure enum', () => {
  it('accepts UNIT', () => {
    expect(unitOfMeasure.safeParse('UNIT').success).toBe(true);
  });

  it('rejects invalid value', () => {
    expect(unitOfMeasure.safeParse('INVALID').success).toBe(false);
  });
});

describe('productStatus enum', () => {
  it('accepts ACTIVE and ARCHIVED', () => {
    expect(productStatus.safeParse('ACTIVE').success).toBe(true);
    expect(productStatus.safeParse('ARCHIVED').success).toBe(true);
  });

  it('rejects invalid status', () => {
    expect(productStatus.safeParse('DELETED').success).toBe(false);
  });
});

describe('costMethod enum', () => {
  it('accepts valid methods', () => {
    expect(costMethod.safeParse('INHERIT').success).toBe(true);
    expect(costMethod.safeParse('STANDARD').success).toBe(true);
    expect(costMethod.safeParse('WAC').success).toBe(true);
    expect(costMethod.safeParse('FIFO').success).toBe(true);
  });

  it('rejects invalid method', () => {
    expect(costMethod.safeParse('LIFO').success).toBe(false);
  });
});
