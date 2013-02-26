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
        this.mouseMove = __bind(this.mouseMove, this);
        this.on_mouseUp = __bind(this.on_mouseUp, this);
        this.on_mouseDown = __bind(this.on_mouseDown, this);
        this.render(data);
    }
    TaskView.prototype.setState = function (state) {
        if (!(STATE_TODO <= state && state <= STATE_DONE)) {
            return;
        }
        console.log('update state', this.id, state);
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
        return this.el;
    };
    TaskView.prototype.on_mouseDown = function (e) {
        var offset;
        app.draggedObj = this;
        this.el.addClass('drag');
        offset = this.el.offset();
        this.offset = {
            x: offset.left + e.offsetX,
            y: offset.top + e.offsetY
        };
        $(document).one('mouseup', this.on_mouseUp);
        $(document).on('mousemove', this.mouseMove);
        return $(document).trigger('start-drag', this);
    };
    TaskView.prototype.on_mouseUp = function (e) {
        $(document).off('mousemove', this.mouseMove);
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
    TaskView.prototype.mouseMove = function (e) {
        return this.el.css({
            top: e.pageY - this.offset.y,
            left: e.pageX - this.offset.x
        });
    };
    TaskView.prototype.remove = function () {
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
        console.log(this.views);
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
            console.log('DROP IN', this.id);
            if (this.add(ctx.obj)) {
                return this.render();
            }
        } else {
            console.log('DROP OUT', this.id);
            if (this.remove(ctx.obj)) {
                return this.render();
            }
        }
    };
    return TaskListView;
}();
CreateCardView = function () {
    function CreateCardView(options) {
        this.on_resetBtnClick = __bind(this.on_resetBtnClick, this);
        this.on_keyUp = __bind(this.on_keyUp, this);
        this.id = options.id;
        this.el = $('#' + this.id);
        this.nameInput = this.el.find('.name-input');
        this.bugCheckbox = this.el.find('.isbug-input');
        this.resetButton = this.el.find('.reset-btn');
        this.el.focus();
        $(document).keyup(this.on_keyUp);
        this.resetButton.click(this.on_resetBtnClick);
    }
    CreateCardView.prototype.on_keyUp = function (e) {
        var type;
        if (e.keyCode === 13) {
            console.log(this.bugCheckbox.val());
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
    return CreateCardView;
}();
App = function () {
    App.prototype._loadFromStorage = function () {
        var i, key, result, _i, _ref;
        result = {};
        for (i = _i = 0, _ref = localStorage.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
            key = localStorage.key(i);
            result[key] = JSON.parse(localStorage.getItem(key));
        }
        return result;
    };
    function App() {
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
        this._resetLists();
        $(document).on('submit-card', this.on_submitCard);
        $(document).on('reset-storage', this.on_resetStorage);
    }
    App.prototype._resetLists = function () {
        var _this = this;
        this.todoList.reset();
        this.inProcessList.reset();
        this.doneList.reset();
        return $.getJSON('cards.json', function (data) {
            var card, cards, key, _i, _len, _ref;
            cards = {};
            for (_i = 0, _len = data.length; _i < _len; _i++) {
                card = data[_i];
                cards[card.id] = card;
            }
            console.log(cards);
            $.extend(cards, _this._loadFromStorage());
            console.log(cards);
            for (key in cards) {
                card = cards[key];
                if ((_ref = card.state) == null) {
                    card.state = STATE_TODO;
                }
                switch (card.state) {
                case STATE_TODO:
                    _this.todoList.add(new TaskView(card));
                    break;
                case STATE_PROGRESS:
                    _this.inProcessList.add(new TaskView(card));
                    break;
                case STATE_DONE:
                    _this.doneList.add(new TaskView(card));
                }
            }
            _this.todoList.render();
            _this.inProcessList.render();
            return _this.doneList.render();
        });
    };
    App.prototype.on_submitCard = function (e, data) {
        return this.createCard(data.name, data.type);
    };
    App.prototype.on_resetStorage = function (e) {
        localStorage.clear();
        return this._resetLists();
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
$(function () {
    return window.app = new App();
});