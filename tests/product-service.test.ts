import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ProductLookup } from "../src/services/product-service";

global.fetch = vi.fn();

describe("ProductLookup", () => {
  let lookup: ProductLookup;
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    // Mock localStorage
    localStorageMock = {};
    global.localStorage = {
      getItem: vi.fn((key) => localStorageMock[key] || null),
      setItem: vi.fn((key, value) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
    } as any;
    lookup = new ProductLookup();
    (fetch as any).mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should cache and retrieve product info", async () => {
    const product = { barcode: "123", name: "Test", brand: "Brand" };
    lookup._cacheProduct("123", product);
    const result = await lookup.getProductInfo("123");
    expect(result).toEqual(product);
  });

  it("should fetch from OpenFoodFacts and cache", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 1,
        product: {
          product_name: "Milk",
          brands: "BrandA",
          categories: "Dairy",
          image_url: "img",
          countries: "SE",
        },
      }),
    });
    const result = await lookup.getProductInfo("456");
    expect(result).toMatchObject({
      name: "Milk",
      brand: "BrandA",
      source: "openfoodfacts",
    });
    expect(lookup.cache.has("456")).toBe(true);
  });

  it("should fallback to UPCItemDB if OpenFoodFacts fails", async () => {
    (fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 0 }) }) // OpenFoodFacts fail
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [{ title: "Juice", brand: "BrandB", category: "Drinks" }],
        }),
      });
    const result = await lookup.getProductInfo("789");
    expect(result).toMatchObject({
      name: "Juice",
      brand: "BrandB",
      source: "upcitemdb",
    });
    expect(lookup.cache.has("789")).toBe(true);
  });

  it("should return null if no product found", async () => {
    (fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 0 }) }) // OpenFoodFacts fail
      .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) }); // UPCItemDB fail
    const result = await lookup.getProductInfo("000");
    expect(result).toBeNull();
  });

  it("should call onFound in lookupBarcode if product found", async () => {
    const product = { barcode: "111", name: "Test", brand: "Brand" };
    lookup._cacheProduct("111", product);
    const onFound = vi.fn();
    const onManual = vi.fn();
    await lookup.lookupBarcode("111", onFound, onManual);
    expect(onFound).toHaveBeenCalledWith(product);
    expect(onManual).not.toHaveBeenCalled();
  });

  it("should call onManual in lookupBarcode if not found", async () => {
    const onFound = vi.fn();
    const onManual = vi.fn();
    (fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 0 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) });
    await lookup.lookupBarcode("999", onFound, onManual);
    expect(onManual).toHaveBeenCalledWith("999");
    expect(onFound).not.toHaveBeenCalled();
  });

  it("should clear cache and remove from localStorage", () => {
    lookup._cacheProduct("222", {
      barcode: "222",
      name: "Test2",
      brand: "Brand2",
    });
    expect(lookup.cache.size).toBe(1);
    lookup.clearCache();
    expect(lookup.cache.size).toBe(0);
    expect(localStorage.removeItem).toHaveBeenCalledWith(lookup.cacheKey);
    expect(localStorage.removeItem).toHaveBeenCalledWith(lookup.historyKey);
  });
});
