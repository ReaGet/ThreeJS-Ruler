class UI {
  constructor() {
    this.listeners = {};
    this.history = document.querySelector(".ui-buttons__history");
    this.content = document.querySelector(".ui-content");
    this.body = document.body;
    this.coords = {
      parent: document.querySelector(".ui-coords"),
      xAxis: document.querySelector(".ui-coords #xAxis"),
      yAxis: document.querySelector(".ui-coords #yAxis"),
      zAxis: document.querySelector(".ui-coords #zAxis"),
    };
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
      const isUI = (event.target.closest(".ui")) ? "ui" : "";

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
    document.addEventListener("input", (event) => {
      if (event.target.tagName !== "INPUT") {
        return;
      }
      const coords = {
        x: +this.coords.xAxis.value,
        y: +this.coords.yAxis.value,
        z: +this.coords.zAxis.value,
      };
      this.emit("uiCoordsUpdated", coords);
    });
    this.on("creating", (hasLines) => {
      if (!hasLines) { return; }
      this.buttons.main.setAttribute("data-type", "accept");
      this.buttons.remove.classList.remove("disabled");
    });
    this.on("editing", (hasSelected) => {
      if (!hasSelected) { return; }
      this.buttons.remove.classList.remove("disabled");
      this.coords.parent.classList.add("active");
    });
    this.on("cancelRuler", this.cancelRuler.bind(this));
    this.on("history", (undo, redo) => {
      const enable = undo || redo;
      this.history.classList[enable ? "remove" : "add"]("hidden");
      this.buttons.undo.classList[undo ? "remove" : "add"]("disabled");
      this.buttons.redo.classList[redo ? "remove" : "add"]("disabled");
      !undo && !redo && this.cancelRuler();
    });
    this.on("setCoords", this.setCoords.bind(this));
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
    this.coords.parent.classList.remove("active");
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
  setCoords(coords) {
    this.coords.xAxis.value = coords.x;
    this.coords.yAxis.value = coords.y;
    this.coords.zAxis.value = coords.z;
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