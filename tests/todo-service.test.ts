import { describe, it, expect, vi, beforeEach } from "vitest";
import { TodoService } from "../src/services/todo-service";

describe("TodoService", () => {
  let service: TodoService;
  let hass: any;
  let entityId: string;

  beforeEach(() => {
    hass = {
      callService: vi.fn().mockResolvedValue(true),
      callWS: vi.fn().mockResolvedValue({
        response: {
          "todo.test": {
            items: [
              {
                name: "Milk",
                description: "barcode:123;brand:BrandA;count:1;total:1",
                status: "pending",
                uid: "1",
              },
              {
                name: "Bread",
                description: "barcode:456;brand:BrandB;count:2;total:2",
                status: "completed",
                uid: "2",
              },
            ],
          },
        },
      }),
      services: {
        todo: {
          add_item: true,
          update_item: true,
          remove_item: true,
          clear_completed: true,
        },
      },
    };
    entityId = "todo.test";
    service = new TodoService(hass);
  });

  it("gets items for entity", async () => {
    const items = await service.getItems(entityId);
    expect(items.length).toBe(2);
    expect(items[0].name).toBe("Milk");
  });

  it("adds item and calls Home Assistant service", async () => {
    await service.addItem("Eggs", entityId, {
      name: "Eggs",
      barcode: "789",
      brand: "BrandC",
    });
    expect(hass.callService).toHaveBeenCalled();
  });

  it("removes item and calls Home Assistant service", async () => {
    await service.removeItem("Milk", entityId);
    expect(hass.callService).toHaveBeenCalledWith("todo", "remove_item", {
      entity_id: entityId,
      item: "Milk",
    });
  });

  it("toggles item complete", async () => {
    const result = await service.toggleComplete("1", entityId);
    expect(result).toBe(true);
    expect(hass.callService).toHaveBeenCalledWith(
      "todo",
      "update_item",
      expect.objectContaining({
        entity_id: entityId,
        item: "1",
        status: "completed",
      }),
    );
  });

  it("clears completed items", async () => {
    const result = await service.clearCompleted(entityId);
    expect(result).toBe(true);
    expect(hass.callService).toHaveBeenCalledWith(
      "todo",
      "update_item",
      expect.objectContaining({
        entity_id: entityId,
        item: "2",
        status: "needs_action",
      }),
    );
    // Optionally check for clear_completed if called
    const clearCompletedCall = hass.callService.mock.calls.find(
      (call: any[]) => call[1] === "clear_completed",
    );
    if (clearCompletedCall) {
      expect(clearCompletedCall).toEqual([
        "todo",
        "clear_completed",
        { entity_id: entityId },
      ]);
    }
  });
});
