  
/**
 * ShoppingListService - Unified Home Assistant shopping/todo list service
 */
  export class ShoppingListService {
    private hass: any;

    constructor(hass: any) {
      this.hass = hass;
    }

    /**
     * Update an existing item with incremented count and total
     */
    async updateItemWithCountAndTotal(existing: any, entityId: string, name: string, barcode = ''): Promise<boolean> {
      try {
        const desc = existing.description || '';
        const countMatch = desc.match(/count:(\d+)/);
        const totalMatch = desc.match(/total:(\d+)/);
        let newCount = countMatch ? parseInt(countMatch[1], 10) + 1 : 2;
        let newTotal = totalMatch ? parseInt(totalMatch[1], 10) + 1 : newCount;
        const newDesc = `barcode:${barcode};count:${newCount};total:${newTotal}`;
        await this.hass.callService('todo', 'update_item', {
          entity_id: entityId,
          item: existing.id,
          name,
          description: newDesc
        });
        console.log('[ShoppingListService] updateItemWithCountAndTotal', { name, entityId, newDesc });
        return true;
      } catch (error) {
        console.error('[ShoppingListService] updateItemWithCountAndTotal failed', { error, name, entityId });
        return false;
      }
    }

  async addItem(name: string, entityId: string, description = ''): Promise<boolean> {
    console.log('[ShoppingListService] addItem called', { name, entityId, description });
    try {
      if (!this.hass) {
        console.error('[ShoppingListService] No hass instance available');
        return false;
      }
      if (!entityId) {
        console.error('[ShoppingListService] No entityId provided');
        return false;
      }
      if (!name) {
        console.error('[ShoppingListService] No item name provided');
        return false;
      }
      // Fetch items using status 'needs_action' (active)
      const entity = this.hass.states[entityId];
      const items = entity?.attributes?.items || [];
      const normalizedName = name.trim().toLowerCase();
      // Prefer uid if available, but fallback to name if not
      const existing = items.find(item => {
        const itemName = (item.summary || item.name || '').trim().toLowerCase();
        const status = item.status || (item.complete === true ? 'completed' : 'needs_action');
        return itemName === normalizedName && status === 'needs_action';
      });
      let newCount = 1;
      let newTotal = 1;
      let barcode = '';
      if (description) {
        const barcodeMatch = description.match(/barcode:([^;]*)/);
        if (barcodeMatch) barcode = barcodeMatch[1];
      }
      if (existing) {
        // Parse count and total from description
        const desc = existing.description || '';
        const countMatch = desc.match(/count:(\d+)/);
        const totalMatch = desc.match(/total:(\d+)/);
        newCount = countMatch ? parseInt(countMatch[1], 10) + 1 : 2;
        newTotal = totalMatch ? parseInt(totalMatch[1], 10) + 1 : newCount;
        const newDesc = `barcode:${barcode};count:${newCount};total:${newTotal}`;
        // Use uid if available, otherwise fallback to name
        const itemId = existing.uid || existing.id || existing.name;
        await this.hass.callService('todo', 'update_item', {
          entity_id: entityId,
          item: itemId,
          description: newDesc
        });
        console.log('[ShoppingListService] Updated existing item', { name, entityId, newDesc, itemId });
        return true;
      } else {
        // Add new item with count and total
        const newDesc = `barcode:${barcode};count:1;total:1`;
        await this.hass.callService('todo', 'add_item', {
          entity_id: entityId,
          item: name,
          description: newDesc
        });
        console.log('[ShoppingListService] addItem completed', { name, entityId, newDesc });
        return true;
      }
    } catch (error) {
      console.error('[ShoppingListService] addItem failed', { error, name, entityId, description });
      return false;
    }
  }

  async getItems(entityId: string): Promise<any[]> {
    console.log('[ShoppingListService] getItems called', { entityId });
    try {
      const entity = this.hass.states[entityId];
      const items = entity?.attributes?.items || [];
      console.log('[ShoppingListService] getItems result', { entityId, items });
      return items;
    } catch (error) {
      console.error('[ShoppingListService] Failed to get shopping list items:', error);
      return [];
    }
  }

  async removeItem(itemId: string, entityId: string): Promise<boolean> {
    try {
      const availableServices = this.hass.services || {};
      if (availableServices['todo'] && availableServices['todo']['remove_item']) {
        await this.hass.callService('todo', 'remove_item', {
          entity_id: entityId,
          item: itemId
        });
        return true;
      } else {
        throw new Error('Todo service not available. Enable the Todo integration.');
      }
    } catch (error) {
      console.error('Failed to remove item:', error);
      return false;
    }
  }

  async toggleComplete(itemId: string, entityId: string): Promise<boolean> {
    try {
      const availableServices = this.hass.services || {};
      if (availableServices['todo'] && availableServices['todo']['update_item']) {
        await this.hass.callService('todo', 'update_item', {
          entity_id: entityId,
          item: itemId,
          status: 'completed'
        });
        return true;
      } else {
        throw new Error('Todo service not available. Enable the Todo integration.');
      }
    } catch (error) {
      console.error('Failed to toggle item completion:', error);
      return false;
    }
  }

  async clearCompleted(entityId: string): Promise<boolean> {
    try {
      const availableServices = this.hass.services || {};
      if (availableServices['todo'] && availableServices['todo']['clear_completed_items']) {
        await this.hass.callService('todo', 'clear_completed_items', {
          entity_id: entityId
        });
        return true;
      } else {
        throw new Error('Todo service not available. Enable the Todo integration.');
      }
    } catch (error) {
      console.error('Failed to clear completed items:', error);
      return false;
    }
  }

  formatProductDescription(product: any): string {
    if (!product) return '';
    const parts = [];
    if (product.brand) parts.push(`Brand: ${product.brand}`);
    if (product.barcode) parts.push(`Barcode: ${product.barcode}`);
    if (product.source) parts.push(`Source: ${product.source}`);
    return parts.join(' | ');
  }
}
