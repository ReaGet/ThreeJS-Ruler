import createMachine from "./stateMachine.js";
import emitter from "./emitter.js";

const uiContentEl = document.querySelector(".ui-content");
const rulerEl = document.querySelector(".ui-btn.ruler");
const mainBtn = document.querySelector(".ui-btn.ui-btn--main");
const removeBtn = document.querySelector(".ui-btn.remove");

const machine = createMachine({
  initialState: "off",
  off: {
    actions: {
      onEnter() {
        console.log("off: onEnter");
        rulerEl.classList.remove("hidden");
      },
      onExit() {
        console.log("off: onExit");
      },
      toggleUI() {
        rulerEl.classList.toggle("active");
        uiContentEl.classList.toggle("active");
      },
      enableRuler(machine) {
        mainBtn.classList.add("active");
        rulerEl.classList.add("hidden");
        mainBtn.setAttribute("data-action", "cancelRuler");
        document.body.classList.add("creating");
        UI.emit("rulerEnabled");
        // machine.transition(machine.value, "switch");
      },
      cancelRuler() {
        mainBtn.classList.remove("active");
        rulerEl.classList.remove("hidden");
        mainBtn.setAttribute("data-action", "enableRuler");
        document.body.classList.remove("creating");
        UI.emit("rulerCanceled");
      },
    },
    transitions: {
      startCreating: {
        target: "creating",
        action() {
          console.log("transition action for 'switch' in 'off' state");
        },
      },
    },
  },
  creating: {
    actions: {
      onEnter() {
        console.log("on: onEnter");
        mainBtn.classList.remove("add");
        mainBtn.classList.add("accept");
        removeBtn.classList.add("active");
        UI.emit("creating");
      },
      onExit() {
        console.log("on: onExit");
        mainBtn.classList.add("add");
        mainBtn.classList.remove("accept");
        removeBtn.classList.remove("active");
      },
      removeLines(machine) {
        mainBtn.classList.remove("active");
        rulerEl.classList.remove("hidden");
        mainBtn.setAttribute("data-action", "enableRuler");
        document.body.classList.remove("creating");
        machine.transition(machine.value, "stopCreating");
        UI.emit("removeLine");
      },
      cancelRuler(machine) {
        mainBtn.classList.remove("active");
        rulerEl.classList.remove("hidden");
        mainBtn.setAttribute("data-action", "enableRuler");
        document.body.classList.remove("creating");
        machine.transition(machine.value, "stopCreating");
        UI.emit("rulerCanceled");
      },
    },
    transitions: {
      stopCreating: {
        target: "off",
        action() {
          console.log("transition action for 'switch' in 'on' state");
        },
      },
    },
  },
});

document.body.addEventListener("click", (event) => {
  const clicked = event.target.closest("[data-action]");
  const action = clicked && clicked.getAttribute("data-action");
  
  const state = machine.value;
  machine.action(state, action);
});

document.body.addEventListener("keyup", (event) => {  
  const state = machine.value;
  if (event.key === "Escape") {
    machine.action(state, "cancelRuler");
  }
});

const UI = {
  ...emitter,
  set(action) {
    const state = machine.value;
    machine.transition(state, action);
  },
};

export default UI;