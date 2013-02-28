var App, CARD_BUG, CARD_TASK, CreateCardView, STATE_DONE, STATE_PROGRESS, STATE_TODO, STATE_UNDEFINED, TaskListView, TaskView, __bind = function (fn, me) {
        return function () {
            return fn.apply(me, arguments);
        };
    };
CARD_TASK = 'task';
CARD_BUG = 'bug';
STATE_UNDEFINED = 0;
STATE_TODO = 1;
STATE_PROGRESS = 2;
STATE_DONE = 3;
TaskView = function () {
    TaskView.prototype.template = '<div class="card <%= type %>" id="task-<%= id %>">#<%= id %> <%= name %></div>';
    function TaskView(data) {
        this.on_mouseMove = __bind(this.on_mouseMove, this);
        this.on_mouseUp = __bind(this.on_mouseUp, this);
        this.on_mouseDown = __bind(this.on_mouseDown, this);
        this.on_globalKeyDown = __bind(this.on_globalKeyDown, this);
        this.on_keyDown = __bind(this.on_keyDown, this);
        this.on_blur = __bind(this.on_blur, this);
        this.on_doubleClick = __bind(this.on_doubleClick, this);
        this.on_selectCard = __bind(this.on_selectCard, this);
        this.on_click = __bind(this.on_click, this);
        this.render(data);
    }
    TaskView.prototype.setState = function (state) {
        if (!(STATE_TODO <= state && state <= STATE_DONE)) {
            return;
        }
        this.data.state = state;
        return localStorage[this.id] = JSON.stringify(this.data);
    };
    TaskView.prototype.render = function (data) {
        if (!data) {
            return this.el;
        }
        this.id = data.id;
        this.data = data;
        localStorage[this.id] = JSON.stringify(this.data);
        this.el = $(_.template(this.template, this.data));
        this.el.mousedown(this.on_mouseDown);
        this.el.click(this.on_click);
        this.el.dblclick(this.on_doubleClick);
        $(document).on('select-card', this.on_selectCard);
        return this.el;
    };
    TaskView.prototype.on_click = function (e) {
        if (this.el.hasClass('edit')) {
            return;
        }
        return $(document).trigger('select-card', this.id);
    };
    TaskView.prototype.on_selectCard = function (e, id) {
        if (this.id === id) {
            this.el.addClass('active');
            return $(document).on('keydown', this.on_globalKeyDown);
        } else {
            $(document).off('keydown', this.on_globalKeyDown);
            return this.el.removeClass('active');
        }
    };
    TaskView.prototype.on_doubleClick = function (e) {
        var range, sel;
        if (this.el.hasClass('edit')) {
            return;
        }
        this.el.addClass('edit');
        this.el.attr('contenteditable', 'true');
        this.el.text(this.data.name);
        range = document.createRange();
        sel = window.getSelection();
        range.setStart(this.el.get(0), 1);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        this.el.focus();
        this.el.one('blur', this.on_blur);
        return this.el.on('keydown', this.on_keyDown);
    };
    TaskView.prototype.on_blur = function (e) {
        if (!this.el.hasClass('edit')) {
            return;
        }
        this.el.off('keydown');
        this.el.removeAttr('contenteditable');
        this.el.removeClass('edit');
        this.data.name = this.el.text();
        this.el.text('#' + this.id + ' ' + this.data.name);
        return localStorage[this.id] = JSON.stringify(this.data);
    };
    TaskView.prototype.on_keyDown = function (e) {
        if (this.el.hasClass('edit') && e.keyCode === 13) {
            return this.el.trigger('blur');
        }
    };
    TaskView.prototype.on_globalKeyDown = function (e) {
        if (this.el.hasClass('active') && (e.keyCode === 8 || e.keyCode === 46)) {
            e.preventDefault();
            $(document).trigger('remove-card', this);
            return false;
        }
    };
    TaskView.prototype.on_mouseDown = function (e) {
        var offset;
        if (this.el.hasClass('edit')) {
            return;
        }
        console.log('mousedown');
        app.draggedObj = this;
        this.el.addClass('drag');
        offset = this.el.offset();
        this.offset = {
            x: offset.left + e.offsetX,
            y: offset.top + e.offsetY
        };
        $(document).one('mouseup', this.on_mouseUp);
        $(document).on('mousemove', this.on_mouseMove);
        return $(document).trigger('start-drag', this);
    };
    TaskView.prototype.on_mouseUp = function (e) {
        $(document).off('mousemove', this.on_mouseMove);
        $(document).trigger('drop', {
            x: e.pageX,
            y: e.pageY,
            obj: app.draggedObj
        });
        app.draggedObj = null;
        this.el.css({
            top: 0,
            left: 0
        });
        this.el.removeClass('drag');
        return this.offset = null;
    };
    TaskView.prototype.on_mouseMove = function (e) {
        return this.el.css({
            top: e.pageY - this.offset.y,
            left: e.pageX - this.offset.x
        });
    };
    TaskView.prototype.remove = function () {
        $(document).off('keydown', this.on_globalKeyDown);
        $(document).off('select-card', this.on_selectCard);
        $(document).off('mousemove', this.on_mouseMove);
        this.el.remove();
        return delete this.el;
    };
    return TaskView;
}();
TaskListView = function () {
    function TaskListView(options) {
        this.on_drop = __bind(this.on_drop, this);
        this.on_startDrag = __bind(this.on_startDrag, this);
        this.state = options.state;
        this.id = options.id;
        this.el = $('#' + this.id);
        $(document).on('start-drag', this.on_startDrag);
        $(document).on('drop', this.on_drop);
        this.views = {};
    }
    TaskListView.prototype.add = function (view) {
        if (this.views[view.id]) {
            return false;
        }
        view.setState(this.state);
        this.views[view.id] = view;
        return true;
    };
    TaskListView.prototype.reset = function () {
        var key, view, _ref;
        _ref = this.views;
        for (key in _ref) {
            view = _ref[key];
            view.remove();
        }
        return this.views = {};
    };
    TaskListView.prototype.remove = function (view) {
        if (!this.views[view.id]) {
            return false;
        }
        delete this.views[view.id];
        return true;
    };
    TaskListView.prototype.render = function () {
        var id, view, _ref, _results;
        _ref = this.views;
        _results = [];
        for (id in _ref) {
            view = _ref[id];
            _results.push(this.el.append(view.render()));
        }
        return _results;
    };
    TaskListView.prototype.on_startDrag = function (e) {
        this.offset = this.el.offset();
        this.offset.bottom = this.offset.top + this.el.height();
        return this.offset.right = this.offset.left + this.el.width();
    };
    TaskListView.prototype.on_drop = function (e, ctx) {
        var _ref, _ref1;
        if (this.offset.left <= (_ref = ctx.x) && _ref <= this.offset.right && (this.offset.top <= (_ref1 = ctx.y) && _ref1 <= this.offset.bottom)) {
            if (this.add(ctx.obj)) {
                return this.render();
            }
        } else {
            if (this.remove(ctx.obj)) {
                return this.render();
            }
        }
    };
    return TaskListView;
}();
CreateCardView = function () {
    function CreateCardView(options) {
        this.on_loadBtnClick = __bind(this.on_loadBtnClick, this);
        this.on_resetBtnClick = __bind(this.on_resetBtnClick, this);
        this.on_keyUp = __bind(this.on_keyUp, this);
        this.id = options.id;
        this.el = $('#' + this.id);
        this.nameInput = this.el.find('.name');
        this.bugCheckbox = this.el.find('.isbug');
        this.resetButton = this.el.find('.reset');
        this.loadButton = this.el.find('.load');
        this.el.focus();
        $(document).keyup(this.on_keyUp);
        this.resetButton.click(this.on_resetBtnClick);
        this.loadButton.click(this.on_loadBtnClick);
    }
    CreateCardView.prototype.on_keyUp = function (e) {
        var type;
        if (e.keyCode === 13) {
            type = this.bugCheckbox.prop('checked') ? CARD_BUG : CARD_TASK;
            $(document).trigger('submit-card', {
                name: this.nameInput.val(),
                type: type
            });
            return this.nameInput.val('');
        }
    };
    CreateCardView.prototype.on_resetBtnClick = function (e) {
        return $(document).trigger('reset-storage');
    };
    CreateCardView.prototype.on_loadBtnClick = function (e) {
        return $(document).trigger('load-default');
    };
    return CreateCardView;
}();
App = function () {
    function App(options) {
        if (options == null) {
            options = {};
        }
        this.on_removeCard = __bind(this.on_removeCard, this);
        this.on_loadDefault = __bind(this.on_loadDefault, this);
        this.on_resetStorage = __bind(this.on_resetStorage, this);
        this.on_submitCard = __bind(this.on_submitCard, this);
        this.draggedObj = null;
        this.createCardView = new CreateCardView({ id: 'create-card' });
        this.todoList = new TaskListView({
            id: 'todo',
            state: STATE_TODO
        });
        this.inProcessList = new TaskListView({
            id: 'in-progress',
            state: STATE_PROGRESS
        });
        this.doneList = new TaskListView({
            id: 'done',
            state: STATE_DONE
        });
        this._initLists();
        $(document).on('submit-card', this.on_submitCard);
        $(document).on('reset-storage', this.on_resetStorage);
        $(document).on('load-default', this.on_loadDefault);
        $(document).on('remove-card', this.on_removeCard);
    }
    App.prototype._renderLists = function () {
        this.todoList.render();
        this.inProcessList.render();
        return this.doneList.render();
    };
    App.prototype._resetLists = function (done) {
        this.todoList.reset();
        this.inProcessList.reset();
        return this.doneList.reset();
    };
    App.prototype._loadCards = function () {
        var i, key, result, _i, _ref;
        result = {};
        for (i = _i = 0, _ref = localStorage.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
            key = localStorage.key(i);
            result[key] = JSON.parse(localStorage.getItem(key));
        }
        return result;
    };
    App.prototype._initLists = function () {
        var card, key, _ref, _ref1;
        this._resetLists();
        _ref = this._loadCards();
        for (key in _ref) {
            card = _ref[key];
            if ((_ref1 = card.state) == null) {
                card.state = STATE_TODO;
            }
            switch (card.state) {
            case STATE_TODO:
                this.todoList.add(new TaskView(card));
                break;
            case STATE_PROGRESS:
                this.inProcessList.add(new TaskView(card));
                break;
            case STATE_DONE:
                this.doneList.add(new TaskView(card));
            }
        }
        return this._renderLists();
    };
    App.prototype._loadDefaultCards = function (done) {
        var _this = this;
        return $.getJSON('cards.json', function (data) {
            var card, _i, _len, _ref;
            for (_i = 0, _len = data.length; _i < _len; _i++) {
                card = data[_i];
                if (!!localStorage[card.id]) {
                    continue;
                }
                if ((_ref = card.state) == null) {
                    card.state = STATE_TODO;
                }
                localStorage[card.id] = JSON.stringify(card);
            }
            return typeof done === 'function' ? done() : void 0;
        });
    };
    App.prototype.on_submitCard = function (e, data) {
        return this.createCard(data.name, data.type);
    };
    App.prototype.on_resetStorage = function (e) {
        localStorage.clear();
        this._resetLists();
        return this._renderLists();
    };
    App.prototype.on_loadDefault = function () {
        var _this = this;
        return this._loadDefaultCards(function () {
            return _this._initLists();
        });
    };
    App.prototype.on_removeCard = function (e, view) {
        console.log('remove card', view.id);
        this.todoList.remove(view);
        this.inProcessList.remove(view);
        this.doneList.remove(view);
        localStorage.removeItem(view.id);
        return view.remove();
    };
    App.prototype.createCard = function (name, type) {
        var card;
        if (type == null) {
            type = CARD_TASK;
        }
        if (!name) {
            return;
        }
        card = {
            id: _.uniqueId(),
            name: name,
            type: type
        };
        while (localStorage[card.id]) {
            card.id = _.uniqueId();
        }
        this.todoList.add(new TaskView(card));
        return this.todoList.render();
    };
    return App;
}();