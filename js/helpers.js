$.div = function (klass, id = false) {
  return $(`<div ${id ? "id" : "class"}="${klass}"></div>`);
}

const TWindow = class TypeWindow {
  constructor (opt = {}) {
    this.namespace = "window__";
    this.tag = opt.tag;
    this.desktop = opt.desktop;
    this.pos = {};
    this.dim = {};
    this.__state = "restored";

    this.view = this.render();
  }

  render () {
    const coord = 20 * this.tag;
    [this.pos.x, this.pos.y] = [coord > 720 ? 720 : coord, coord > 280 ? 280 : coord];

    const view = $.div(`${this.namespace}body`);
    view
      .attr("data-id", this.tag)
      .data("instance", this)
      .append(
        $.div(`${this.namespace}caption`)
          .append($.div(`${this.namespace}title`).html(`Caption -- ${this.tag}`))
          .append(
            $.div(`${this.namespace}controls`)
              .append($.div(`${this.namespace}minify`).click(() => {
                this.minify();
              }))
              .append($.div(`${this.namespace}close`).click(() => {
                this.close();
              }))
          )
      )
      .css({
        left: this.pos.x,
        top: this.pos.y,
        zIndex: this.tag
      })
      .click((e) => {
        if (![`${this.namespace}minify`, `${this.namespace}close`].includes(e.target.className))
          this.bringToFront();
      })
      .draggable({
        containment: "#field",
        handle: ".window__title",
        start: this.drag_start.bind(this),
        stop: this.drag_stop.bind(this),
      });

    return view;
  }

  minify () {
    [this.pos.x, this.pos.y] = [this.view.position().left, this.view.position().top];

    this.__state = "inprocess";
    this.view.velocity({ width: 0, height: 0, left: this.panel_btn.position().left, top: 510 }, { display: "none" }).promise().done(() => {
      this.view
        .css("z-index", 0)
        .attr("data-z", 0);
      this.__state = "minified";
      this.desktop.find(".selected").removeClass("selected");
      this.bringToFront(true);
    });

    return this;
  }

  close () {
    const anim = [];

    this.__state = "inprocess";
    anim.push(this.view.velocity({ width: 0, height: 0, left: this.pos.x + this.dim.w / 2, top: this.pos.y + this.dim.h / 2 }, { display: "none" }))
    anim.push(this.panel_btn.velocity({ width: 0 }, { display: "none" }));

    $.when.apply($, anim).done(() => {
      this.panel_btn.remove();
      this.view.remove();
    });

    return this;
  }

  restore () {
    this.__state = "inprocess";
    this.view
      .css("left", this.panel_btn.position().left)
      .velocity({ width: this.dim.w, height: this.dim.h, left: this.pos.x, top: this.pos.y }, { display: "block" }).promise().done(() => {
        this.__state = "restored";
      });

    return this;
  }

  bringToFront (max = false) {
    let z;
    if (!max)
      z = +this.view.css("z-index");
    const a = [];
    this.desktop.find(`.${this.namespace}body`).each((i, e) => {
      const ez = +$(e).css("z-index");
      $(e).removeClass("ontop");
      if (z > 0 && ez > z)
        $(e)
          .css("z-index", ez - 1)
          .attr("data-z", ez - 1);
      a.push(ez);
    });
    const zmax = Math.max.apply(null, a);

    let newz = 1;
    if (zmax > 0)
      if (this.__state == "minified")
        newz = zmax + 1;
      else if (this.__state == "restored")
        newz = zmax;

    if (!max) {
      this.desktop.find(".selected").removeClass("selected");
      this.panel_btn.addClass("selected");
      this.view
        .css("z-index", newz)
        .attr("data-z", newz)
        .addClass("ontop");
    } else {
      if (zmax > 0) {
        const next = this.desktop.find(`.${this.namespace}body[data-z="${zmax}"]`);
        next.addClass("ontop");
        next.data().instance.panel_btn.addClass("selected");
      }
    }

    if (this.__state == "minified" || (this.__state == "restored" && zmax == z))
      return false;

    return true;
  }

  drag_start () {
    this.bringToFront();
  }

  drag_stop () {
    [this.pos.x, this.pos.y] = [this.view.position().left, this.view.position().top];
  }
}

const TSidebar = class TypeSidebar {
  constructor (desktop) {
    this.namespace = "sidebar__";
    this.windows = 0;
    this.desktop = desktop;

    this.view = this.render();
  }

  render () {
    const view = $.div(`${this.namespace}body`, true);
    view
      .append(this.btn_add = $.div(`${this.namespace}window_add`, true))
      .append(this.window_panel = $.div(`${this.namespace}window_panel`, true));

    this.btn_add.click(() => {
      const options = {
        tag: ++this.windows,
        desktop: this.desktop
      };

      const win = new TWindow(options);
      win.view.appendTo(this.desktop);
      [win.dim.w, win.dim.h] = [win.view.outerWidth(), win.view.outerHeight()];

      this.add(win);
      win.bringToFront();
    });

    return view;
  }

  add (_window) {
    const wind = $.div(`${this.namespace}window`);
    wind
      .attr("data-id", _window.tag)
      .data("window", _window)
      .html(_window.tag)
      .click(() => {
        if (_window.__state != "inprocess") {
          if (!_window.bringToFront())
            if (_window.__state == "minified")
              _window.restore();
            else
              _window.minify();
        }
      });
    _window.panel_btn = wind;

    this.window_panel.append(wind);

    return this;
  }
}
