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
      const isUI = clicked ? "ui" : "";

      this.emit("mouseup", event, isUI);
      
      if (isDisabled || !clicked) {
        return;
      }
      this[action] && this[action]();
    });
    document.addEventListener("mousemove", (event) => {
      event.stopPropagation();
      this.emit("mousemove", event);
    });
    this.on("creating", (hasLines) => {
      if (!hasLines) { return; }
      this.buttons.main.setAttribute("data-type", "accept");
      this.buttons.remove.classList.remove("disabled");
    });
    this.on("editing", (hasSelected) => {
      if (!hasSelected) { return; }
      this.buttons.remove.classList.remove("disabled");
    });
    this.on("cancelRuler", () => {
      this.cancelRuler();
    });
    this.on("history", (undo, redo) => {
      const enable = undo || redo;
      this.history.classList[enable ? "remove" : "add"]("hidden");
      this.buttons.undo.classList[undo ? "remove" : "add"]("disabled");
      this.buttons.redo.classList[redo ? "remove" : "add"]("disabled");
      !undo && !redo && this.cancelRuler();
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
    this.buttons.ruler.classList.add("hidden");
    this.emit("rulerEnabled");
  }
  cancelRuler() {
    this.buttons.main.classList.remove("active");
    this.buttons.main.setAttribute("data-action", "enableRuler");
    this.buttons.main.setAttribute("data-type", "add");
    this.buttons.undo.classList.add("disabled");
    this.buttons.redo.classList.add("disabled");
    this.buttons.remove.classList.add("disabled");
    this.buttons.ruler.classList.remove("hidden");
    this.body.classList.remove("creating");
    this.history.classList.add("hidden");    
    this.emit("rulerCanceled");
  }
  remove() {    
    this.emit("remove");
  }
  undo() {
    this.emit("undo");
  }
  redo() {
    this.emit("redo");
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