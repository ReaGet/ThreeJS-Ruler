import createMachine from "./stateMachine.js";
import emitter from "./emitter.js";

class UI {
  constructor() {
    this.listeners = {};
    this.history = document.querySelector(".ui-buttons__history");
    this.content = document.querySelector(".ui-content");
    this.buttons = {
      main: document.querySelector(".ui-btn--main"),
      undo: document.querySelector(".ui-btn[data-type='undo']"),
      redo: document.querySelector(".ui-btn[data-type='redo']"),
      remove: document.querySelector(".ui-btn[data-type='remove']"),
      ruler: document.querySelector(".ui-btn[data-type='ruler']"),
    };
    this.className = {
      active: "active",
      hidden: "hidden",
      disabled: "disabled",
    }
    this.setHistory("hidden", true);
    this.setRemove("disabled", true);
    this.bind();
  }
  bind() {
    document.addEventListener("click", (event) => {
      const clicked = event.target.closest("[data-action]");
      const action = clicked && clicked.getAttribute("data-action");
      const isDisabled = clicked && clicked.classList.contains("disabled");

      if (isDisabled || !clicked) {
        return;
      }

      this.emit("click", action);      
    });
  }
  setBody(type, value) {
    this.set(document.body, type, value);
  }
  setContent(type, value) {
    this.set(this.content, type, value);
  }
  setHistory(type, value) {
    this.set(this.history, type, value);
  }
  setMain(type, value) {
    const action = value === false ? "enableRuler" : "cancelRuler";
    this.set(this.buttons.main, type, value);
    this.buttons.main.setAttribute("data-action", action);
  }
  setUndo(type, value) {
    this.set(this.buttons.undo, type, value);
  }
  setRedo(type, value) {
    this.set(this.buttons.redo, type, value);
  }
  setRemove(type, value) {
    this.set(this.buttons.remove, type, value);
  }
  setRuler(type, value) {
    this.set(this.buttons.ruler, type, value);
  }
  set(element, type, value) {
    const action = value === true ? "add" : (value === false ? "remove" : "toggle");
    element.classList[action](type);
  }
  on(listener, fn) {
    if (!this.listeners[listener]) {
      this.listeners[listener] = [];
    }
    this.listeners[listener].push(fn);
  }
  off(listener) {    
    if (!this.listeners[listener]) {
      return;
    }
    delete this.listeners[listener];
  }
  emit(listener) {
    if (!this.listeners[listener]) {
      return;
    }
    this.listeners[listener].forEach((fn) => {
      fn.call(null, ...[...arguments].slice(1));
    });
  }
}

export default new UI();