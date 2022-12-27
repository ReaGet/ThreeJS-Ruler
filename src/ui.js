import createMachine from "./stateMachine.js";
import emitter from "./emitter.js";

class UI {
  constructor() {
    this.listeners = {};
    this.history = document.querySelector(".ui-buttons__history");
    this.content = document.querySelector(".ui-content");
    this.body = document.body;
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
    this.set(this.history, "hidden", true);
    this.set(this.buttons.remove, "disabled", true);
    this.bind();
  }
  bind() {
    document.addEventListener("mousedown", (event) => {
      event.stopPropagation();
      this.emit("mousedown", event);
    });
    document.addEventListener("mouseup", (event) => {
      event.stopPropagation();
      const clicked = event.target.closest("[data-action]");
      const action = clicked && clicked.getAttribute("data-action");
      const isDisabled = clicked && clicked.classList.contains("disabled");

      this.emit("mouseup", event);
      
      if (isDisabled || !clicked) {
        return;
      }
      this[action] && this[action]();
    });
    document.addEventListener("mousemove", (event) => {
      event.stopPropagation();
      this.emit("mousemove", event);
    });
  }
  toggleUI() {
    this.content.classList.toggle("active");
    this.buttons.ruler.classList.toggle("active");
  }
  enableRuler() {
    this.buttons.main.classList.add("active");
    this.buttons.main.setAttribute("data-action", "cancelRuler");
    this.body.classList.add("creating");
    this.emit("rulerEnabled");
  }
  cancelRuler() {
    this.buttons.main.classList.remove("active");
    this.buttons.main.setAttribute("data-action", "enableRuler");
    this.body.classList.remove("creating");
    this.emit("rulerCanceled");
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