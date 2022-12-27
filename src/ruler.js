import * as THREE from "three";

export default function(scene_) {
  const scene = scene_;
  const lines = [];
  let state = "";
  let current = {
    indicator: null,
    selected: null,
    selectedCanMove: false,
    points: [],
    lines: [],
  };

  function createPoint(point_) {
    const pointGeometry = new THREE.SphereGeometry(7, 32, 16);
    const pointMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff } );
    const point = new THREE.Mesh(pointGeometry, pointMaterial);

    point.userData.dot = true;
    point.position.copy(point_);
    current.points.push(point);
    
    scene.add(point);
  }

  function createLine(a, b) {
    const points = [a, (b || a)];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.LineSegments(
      geometry,
      new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.75,
      })
    );
    line.userData.line = true;
    scene.add(line);
    return line;
  }

  function handleLines() {
    removeLines();

    if (current.points.length < 2) { return; }

    for (let i = 0; i < current.points.length - 1; i++) {
      const line = createLine(
        current.points[i].position,
        current.points[i + 1].position
      );
      current.lines.push(line);
    }  
  }

  function removeLines() {
    for (let i = 0; i < current.lines.length; i++) {
      const line = current.lines[i];
      scene.remove(line);
      current.lines.splice(i, 1);
      i--;
    }
  }

  function removePoint(point) {
    for (let i = 0; i < current.points.length; i++) {
      const p = current.points[i];
      if (p.uuid === point.uuid) {
        scene.remove(p);
        current.points.splice(i, 1);
        i--;
      }
    }
  }

  function updatePoint(target) {
    const point = current.selected;
    point.position.set(target.x, target.y, target.z);
    point.position.needsUpdate = true;
    handleLines();
  }

  function finishStructure() {
    if (current.points.length < 2) {
      current.points.forEach((point) => scene.remove(point));
    }

    const line = {};
    line.points = current.points;
    line.lines = current.lines;

    lines.push(line);
  }

  function resetCurrent() {
    current.selected = null;
    current.points = [];
    current.lines = [];
  }

  function diselect() {
    current.selected && current.selected.material.color.set(0xffffff);
  }

  function updateIndicator(point) {
    const prevPoint = current.points[current.points.length - 1];
    const positions = current.indicator.geometry.attributes.position.array;
    positions[0] = prevPoint.position.x;
    positions[1] = prevPoint.position.y;
    positions[2] = prevPoint.position.z;
    positions[3] = point.x;
    positions[4] = point.y;
    positions[5] = point.z;
    current.indicator.geometry.attributes.position.needsUpdate = true;
  }

  function removeIndicator() {
    if (!current.indicator) { return; }
    scene.remove(current.indicator);
    current.indicator = null;
  }

  const ruler = {
    addPoint(intersaction) {
      const point = intersaction?.point;
      if (state === "selected") {
        this.cancel();
        return;
      }
      if (!point) { return; }
      state = "enabled";

      createPoint(point);
      if (!current.indicator) {
        current.indicator = createLine(point);
      }
      handleLines();
    },
    update(intersaction) {
      const point = intersaction[0]?.point;
      const target = intersaction.filter((item) => (
        item.object.userData?.line !== true && item.object.userData?.dot !== true
      )).at(0);
      if (state === "" || !point || !target) { return; }
      if (state === "selected") {
        current.selectedCanMove && updatePoint(target.point);
      } else {
        updateIndicator(point);
      }
    },
    mouseUp() {
      current.selectedCanMove = false;
    },
    cancel() {
      finishStructure();
      removeIndicator();
      diselect();
      resetCurrent();
      state = "";
    },
    select(intersaction) {
      if (state === "enabled") { return; }
      this.cancel();
      state = "selected";
      current = lines.filter((line) => {
        return line.points.find((point) => {
          return point.uuid === intersaction.object.uuid;
        });
      }).at(0);
      current.selected = intersaction.object;
      current.selected.material.color.set(0xff0000);
      current.selectedCanMove = true;
    },
    removeSelected() {
      if (!current.selected) { return; }
      removePoint(current.selected);
      handleLines();
      this.cancel();
    },
    isRuler(intersaction) {
      return intersaction && intersaction.object.userData.dot === true;
    },
    hasSelected() {
      return !!current.selected;
    },
  };

  return ruler;
};
