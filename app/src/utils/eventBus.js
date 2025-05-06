// Simple event bus for cross-component communication

class EventBus {
  constructor() {
    this.events = {};
  }

  subscribe(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    
    // Return unsubscribe function
    return () => {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    };
  }

  publish(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => {
        callback(data);
      });
    }
  }
}

// Create a singleton instance
const eventBus = new EventBus();

// Event names constants
export const EVENTS = {
  TRANSACTION_UPDATED: 'TRANSACTION_UPDATED',
  CATEGORY_UPDATED: 'CATEGORY_UPDATED',
  BUDGET_UPDATED: 'BUDGET_UPDATED'
};

export default eventBus;
