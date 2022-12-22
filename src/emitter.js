export default {
  listeners: {},
  on(listener, fn) {
    if (!this.listeners[listener]) {
      this.listeners[listener] = [];
    }
    this.listeners[listener].push(fn);
  },
  off(listener) {    
    if (!this.listeners[listener]) {
      return;
    }
    delete this.listeners[listener];
  },
  emit(listener) {
    if (!this.listeners[listener]) {
      return;
    }
    this.listeners[listener].forEach((fn) => {
      fn.call(null, ...[...arguments].slice(1));
    });
  }
};